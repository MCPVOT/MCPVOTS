#!/usr/bin/env python3
"""
Farcaster Ecosystem Analyzer
Comprehensive analysis of the entire Farcaster social ecosystem
"""

import os
import json
import sys
import argparse
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
from dotenv import load_dotenv
import re

# Load environment
load_dotenv()

class FarcasterEcosystemAnalyzer:
    """Comprehensive analyzer for the Farcaster ecosystem"""

    def __init__(self):
        self.api_key = os.getenv('NEYNAR_API_KEY')
        self.signer_uuid = os.getenv('NEYNAR_SIGNER_UUID')
        self.base_url = "https://api.neynar.com"
        self.session = requests.Session()

        if self.api_key:
            self.session.headers.update({
                'x-api-key': self.api_key,
                'Content-Type': 'application/json'
            })
        else:
            raise ValueError("NEYNAR_API_KEY not found")

        # Known token symbols for better extraction
        self.known_tokens = {
            'ETH', 'BTC', 'USDC', 'USDT', 'DAI', 'WBTC', 'WETH', 'UNI', 'AAVE', 'LINK',
            'COMP', 'MKR', 'SNX', 'SUSHI', 'YFI', 'BAL', 'REN', 'BAT', 'OMG', 'ZRX',
            'LRC', 'REP', 'STORJ', 'ANT', 'MLN', 'FUN', 'GNO', 'RDN', 'RPL',
            'BASE', 'DEGEN', 'BEAN', 'TN100x', 'BUILD', 'HIGHER', 'NORMIE', 'BRETT',
            'TIA', 'STRK', 'ZKS', 'IMX', 'ARB', 'OP', 'MATIC', 'AVAX', 'SOL', 'DOT'
        }

    def analyze_ecosystem(self, hours_back: int = 24) -> Dict[str, Any]:
        """Perform comprehensive ecosystem analysis"""
        print("🔍 Analyzing Farcaster Ecosystem...")

        analysis = {
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "analysis_period_hours": hours_back,
                "analyzer_version": "2.0.0"
            },
            "platform_overview": {},
            "trending_analysis": {},
            "user_ecosystem": {},
            "content_ecosystem": {},
            "token_nft_ecosystem": {},
            "network_health": {},
            "recommendations": []
        }

        try:
            # Platform overview
            analysis["platform_overview"] = self._analyze_platform_overview()

            # Trending analysis
            analysis["trending_analysis"] = self._analyze_trending_content(hours_back)

            # User ecosystem
            analysis["user_ecosystem"] = self._analyze_user_ecosystem()

            # Content ecosystem
            analysis["content_ecosystem"] = self._analyze_content_ecosystem(hours_back)

            # Token/NFT ecosystem
            analysis["token_nft_ecosystem"] = self._analyze_token_nft_ecosystem(hours_back)

            # Network health
            analysis["network_health"] = self._analyze_network_health()

            # Generate recommendations
            analysis["recommendations"] = self._generate_recommendations(analysis)

        except Exception as e:
            print(f"❌ Ecosystem analysis failed: {e}")
            analysis["error"] = str(e)

        return analysis

    def _analyze_platform_overview(self) -> Dict[str, Any]:
        """Analyze overall platform statistics"""
        print("📊 Gathering platform overview...")

        try:
            # Get trending channels - use v2 feed/trending
            trending_data = self._make_request("v2/farcaster/feed/trending", {"limit": 10})

            # Get some basic stats from search
            search_data = self._make_request("v2/farcaster/cast/search", {
                "q": "farcaster",
                "limit": 10
            })

            # Get user stats - use bulk user lookup
            user_data = self._make_request("v2/farcaster/user/bulk", {
                "fids": "1,2,3,4,5"
            })

            casts = self._sanitize_cast_list(trending_data.get("casts", []))
            users = [user for user in user_data.get("users", []) if isinstance(user, dict)]

            top_channels = []
            for cast in casts[:10]:
                channel_info = cast.get("channel") or {}
                if not channel_info:
                    continue

                description = channel_info.get("description") or ""
                if len(description) > 100:
                    description = description[:100] + "..."

                top_channels.append({
                    "id": channel_info.get("id", ""),
                    "name": channel_info.get("name", ""),
                    "casts_count": 1,  # Individual cast count, not channel total
                    "unique_authors": 1,  # Individual author
                    "description": description
                })

            return {
                "channels_count": len(set((cast.get("channel") or {}).get("id") for cast in casts if cast.get("channel"))),
                "active_channels": len(set((cast.get("channel") or {}).get("id") for cast in casts if cast.get("channel") and cast.get("reactions", {}).get("likes_count", 0) > 0)),
                "trending_casts_sample": len(casts),
                "sample_casts_count": len(casts),
                "users_analyzed": len(users),
                "top_channels": top_channels,
                "analysis_timestamp": datetime.now().isoformat()
            }

        except Exception as e:
            print(f"❌ Platform overview error: {e}")
            return {"error": str(e)}

    def _analyze_trending_content(self, hours_back: int) -> Dict[str, Any]:
        """Analyze trending content and topics"""
        print("📈 Analyzing trending content...")

        try:
            # Get trending casts with proper time window - use v2 feed/trending
            trending = self._make_request("v2/farcaster/feed/trending", {
                "limit": 10
            })

            trending_preview = str(trending)
            if len(trending_preview) > 400:
                trending_preview = trending_preview[:400] + "... (truncated)"
            print(f"DEBUG: trending result type: {type(trending)}, preview: {trending_preview}")
            if trending is None:
                print("ERROR: trending is None!")
                return {"error": "trending API returned None"}

            casts = self._sanitize_cast_list(trending.get("casts", []))
            print(f"DEBUG: sanitized casts length: {len(casts)}")

            # Analyze content themes
            print("DEBUG: About to call _extract_content_themes")
            themes = self._extract_content_themes(casts)
            print(f"DEBUG: themes result: {themes}")

            # Analyze engagement patterns
            print("DEBUG: About to call _analyze_engagement_patterns")
            engagement = self._analyze_engagement_patterns(casts)
            print(f"DEBUG: engagement result: {engagement}")

            # Extract trending topics
            print("DEBUG: About to call _extract_trending_topics")
            trending_topics = self._extract_trending_topics(casts)
            print(f"DEBUG: trending_topics result: {trending_topics}")

            top_casts = []
            for cast in casts[:10]:
                channel_info = cast.get("channel") or {}
                channel_name = channel_info.get("name") or "general"
                text = cast.get("text", "")
                if len(text) > 150:
                    text = text[:150] + "..."

                top_casts.append({
                    "text": text,
                    "author": cast.get("author", {}).get("username", "unknown"),
                    "likes": cast.get("reactions", {}).get("likes_count", 0),
                    "recasts": cast.get("reactions", {}).get("recasts_count", 0),
                    "replies": cast.get("replies", {}).get("count", 0),
                    "channel": channel_name
                })

            result = {
                "total_trending_casts": len(casts),
                "content_themes": themes,
                "engagement_patterns": engagement,
                "trending_topics": trending_topics,
                "top_casts": top_casts
            }
            print(f"DEBUG: _analyze_trending_content returning: {result}")
            return result

        except Exception as e:
            print(f"❌ Trending analysis error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    def _analyze_user_ecosystem(self) -> Dict[str, Any]:
        """Analyze user ecosystem and influencers"""
        print("👥 Analyzing user ecosystem...")

        try:
            # Get trending casts to analyze user activity - use v2 feed/trending
            trending = self._make_request("v2/farcaster/feed/trending", {"limit": 10})
            print(f"DEBUG: user ecosystem trending result type: {type(trending)}, value: {trending is not None}")
            if trending is None:
                print("ERROR: user ecosystem trending is None!")
                return {"error": "trending API returned None"}

            casts = self._sanitize_cast_list(trending.get("casts", []))
            print(f"DEBUG: user ecosystem sanitized casts length: {len(casts)}")

            # Extract user activity
            print("DEBUG: About to process user activity")
            user_activity = {}
            for cast in casts:
                author = cast.get("author", {})
                fid = author.get("fid")
                if fid:
                    if fid not in user_activity:
                        user_activity[fid] = {
                            "fid": fid,
                            "username": author.get("username", f"user_{fid}"),
                            "casts_count": 0,
                            "total_likes": 0,
                            "total_recasts": 0,
                            "total_replies": 0,
                            "channels": set()
                        }

                    user_activity[fid]["casts_count"] += 1
                    user_activity[fid]["total_likes"] += cast.get("reactions", {}).get("likes_count", 0)
                    user_activity[fid]["total_recasts"] += cast.get("reactions", {}).get("recasts_count", 0)
                    user_activity[fid]["total_replies"] += cast.get("replies", {}).get("count", 0)

                    channel_name = (cast.get("channel") or {}).get("name")
                    if channel_name:
                        user_activity[fid]["channels"].add(channel_name)

            print(f"DEBUG: user_activity keys: {list(user_activity.keys())[:5]}")

            # Convert sets to lists for JSON serialization
            for user in user_activity.values():
                user["channels"] = list(user["channels"])
                user["total_engagement"] = user["total_likes"] + user["total_recasts"] + user["total_replies"]

            # Sort by total engagement
            print("DEBUG: About to sort users")
            top_users = sorted(user_activity.values(), key=lambda x: x["total_engagement"], reverse=True)[:15]

            print("DEBUG: About to call helper methods")
            user_engagement_stats = self._calculate_user_engagement_stats(top_users)
            channel_diversity = self._analyze_channel_diversity(top_users)

            result = {
                "total_unique_users": len(user_activity),
                "total_unique_users_analyzed": len(user_activity),
                "total_casts_analyzed": len(casts),
                "top_influencers": top_users,
                "user_engagement_stats": user_engagement_stats,
                "channel_diversity": channel_diversity
            }
            print(f"DEBUG: _analyze_user_ecosystem returning with {len(user_activity)} users")
            return result

        except Exception as e:
            print(f"❌ User ecosystem error: {e}")
            import traceback
            traceback.print_exc()
            return {"error": str(e)}

    def _analyze_content_ecosystem(self, hours_back: int) -> Dict[str, Any]:
        """Analyze content ecosystem and patterns"""
        print("📝 Analyzing content ecosystem...")

        try:
            # Get diverse content sample - use v2 cast/search
            content_casts = []
            search_terms = ["crypto", "defi", "base", "ethereum", "web3"]  # Reduced from 8 to 5

            for term in search_terms:
                print(f"DEBUG: Searching casts for term '{term}'")
                search_result = self._make_request("v2/farcaster/cast/search", {
                    "q": term,
                    "limit": 10  # Reduced limit
                })
                print(f"DEBUG: search_result keys: {list(search_result.keys())}")
                casts = self._sanitize_cast_list(search_result.get("result", {}).get("casts", []))
                print(f"DEBUG: Retrieved {len(casts)} casts for term '{term}'")
                content_casts.extend(casts)
                # Add small delay to avoid rate limiting
                import time
                time.sleep(0.5)

            print(f"DEBUG: Total casts before dedupe: {len(content_casts)}")

            # Remove duplicates based on cast hash
            unique_casts = []
            seen_hashes = set()
            for cast in content_casts:
                cast_hash = cast.get("hash")
                if cast_hash and cast_hash not in seen_hashes:
                    unique_casts.append(cast)
                    seen_hashes.add(cast_hash)

            print(f"DEBUG: Unique casts after dedupe: {len(unique_casts)}")

            # Analyze content types and patterns
            print("DEBUG: About to analyze content patterns")
            content_analysis = self._analyze_content_patterns(unique_casts)
            print(f"DEBUG: content_analysis keys: {list(content_analysis.keys()) if content_analysis else 'empty'}")

            # Analyze temporal patterns
            print("DEBUG: About to analyze temporal patterns")
            temporal_patterns = self._analyze_temporal_patterns(unique_casts)
            print(f"DEBUG: temporal_patterns keys: {list(temporal_patterns.keys()) if temporal_patterns else 'empty'}")

            # Analyze sentiment
            print("DEBUG: About to analyze sentiment")
            sentiment_analysis = self._analyze_content_sentiment(unique_casts)
            print(f"DEBUG: sentiment_analysis keys: {list(sentiment_analysis.keys()) if sentiment_analysis else 'empty'}")

            engagement_by_type = self._analyze_engagement_by_type(unique_casts)
            channel_distribution = self._analyze_channel_distribution(unique_casts)

            result = {
                "total_casts_analyzed": len(unique_casts),
                "content_patterns": content_analysis,
                "temporal_patterns": temporal_patterns,
                "sentiment_analysis": sentiment_analysis,
                "engagement_by_content_type": engagement_by_type,
                "channel_distribution": channel_distribution
            }
            print(f"DEBUG: _analyze_content_ecosystem returning with {len(unique_casts)} casts")
            return result

        except Exception as e:
            print(f"❌ Content ecosystem error: {e}")
            return {"error": str(e)}

    def _analyze_token_nft_ecosystem(self, hours_back: int) -> Dict[str, Any]:
        """Analyze token and NFT ecosystem on Farcaster"""
        print("🪙 Analyzing token/NFT ecosystem...")

        try:
            # Search for token-related content with better queries
            token_casts = []
            nft_casts = []

            token_queries = ["token", "crypto price", "defi", "trading"]  # Reduced from 6 to 4
            nft_queries = ["nft", "collectible", "art", "mint"]  # Reduced from 7 to 4

            for query in token_queries:
                casts = self._sanitize_cast_list(
                    self._make_request("v2/farcaster/cast/search", {
                        "q": query,
                        "limit": 10  # Reduced limit
                    }).get("result", {}).get("casts", [])
                )
                token_casts.extend(casts)
                # Add delay to avoid rate limiting
                import time
                time.sleep(0.5)

            for query in nft_queries:
                casts = self._sanitize_cast_list(
                    self._make_request("v2/farcaster/cast/search", {
                        "q": query,
                        "limit": 10  # Reduced limit
                    }).get("result", {}).get("casts", [])
                )
                nft_casts.extend(casts)
                # Add delay to avoid rate limiting
                import time
                time.sleep(0.5)

            # Extract trending tokens/NFTs with better logic
            trending_tokens = self._extract_trending_tokens(token_casts)
            trending_nfts = self._extract_trending_nfts(nft_casts)

            # Analyze market sentiment
            market_sentiment = self._analyze_market_sentiment(token_casts)

            return {
                "token_discussions": {
                    "total_casts": len(token_casts),
                    "unique_authors": len(set(cast.get("author", {}).get("fid") for cast in token_casts if cast.get("author"))),
                    "trending_tokens": trending_tokens,
                    "market_sentiment": market_sentiment
                },
                "nft_discussions": {
                    "total_casts": len(nft_casts),
                    "unique_authors": len(set(cast.get("author", {}).get("fid") for cast in nft_casts if cast.get("author"))),
                    "trending_nfts": trending_nfts
                },
                "cross_ecosystem_insights": self._analyze_cross_ecosystem(token_casts, nft_casts),
                "ecosystem_health_score": self._calculate_ecosystem_health(token_casts, nft_casts)
            }

        except Exception as e:
            print(f"❌ Token/NFT ecosystem error: {e}")
            return {"error": str(e)}

    def _analyze_network_health(self) -> Dict[str, Any]:
        """Analyze network health and activity metrics"""
        print("🏥 Analyzing network health...")

        try:
            # Get various health metrics
            health_metrics = {
                "api_responsiveness": self._test_api_responsiveness(),
                "content_freshness": self._analyze_content_freshness(),
                "network_activity_score": 0,
                "error_rate": 0,
                "analysis_timestamp": datetime.now().isoformat()
            }

            # Calculate network activity score
            trending = self._make_request("v2/farcaster/feed/trending", {"limit": 10})
            casts = trending.get("casts", [])

            if casts:
                total_engagement = sum(
                    cast.get("reactions", {}).get("likes_count", 0) +
                    cast.get("reactions", {}).get("recasts_count", 0) +
                    cast.get("replies", {}).get("count", 0)
                    for cast in casts
                )
                health_metrics["network_activity_score"] = min(100, total_engagement // 10)  # Scale to 0-100

            return health_metrics

        except Exception as e:
            print(f"❌ Network health error: {e}")
            return {"error": str(e)}

    def _generate_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on analysis"""
        recommendations = []

        try:
            # Platform recommendations
            platform = analysis.get("platform_overview", {})
            if platform.get("channels_count", 0) > 15:
                recommendations.append("Strong channel diversity indicates healthy ecosystem segmentation")

            # Trending content recommendations
            trending = analysis.get("trending_analysis", {})
            if trending.get("total_trending_casts", 0) > 30:
                recommendations.append("High trending content volume suggests active community engagement")

            # User ecosystem recommendations
            users = analysis.get("user_ecosystem", {})
            if users.get("total_unique_users", 0) > 50:
                recommendations.append("Diverse and active user base indicates ecosystem vitality")

            # Content recommendations
            content = analysis.get("content_ecosystem", {})
            if content.get("total_casts_analyzed", 0) > 100:
                recommendations.append("Rich content ecosystem with substantial user-generated content")

            # Token/NFT recommendations
            token_nft = analysis.get("token_nft_ecosystem", {})
            token_discussions = token_nft.get("token_discussions", {})
            if token_discussions.get("total_casts", 0) > 50:
                recommendations.append("Active token discussion community shows strong DeFi interest")

            # Network health recommendations
            health = analysis.get("network_health", {})
            activity_score = health.get("network_activity_score", 0)
            if activity_score > 70:
                recommendations.append("Excellent network activity - ecosystem is thriving")
            elif activity_score > 40:
                recommendations.append("Good network activity with room for growth")
            else:
                recommendations.append("Monitor network activity for potential engagement opportunities")

        except Exception as e:
            recommendations.append(f"Analysis error: {e}")

        if not recommendations:
            recommendations.append("Ecosystem analysis completed successfully")

        return recommendations

    # Helper methods
    def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make API request with error handling"""
        try:
            url = f"{self.base_url}/{endpoint}"
            print(f"🔍 Making request to: {url} with params: {params}")
            response = self.session.get(url, params=params, timeout=15)
            print(f"📡 Response status: {response.status_code}")
            response.raise_for_status()
            result = response.json()
            result_preview = str(result)
            if len(result_preview) > 500:
                result_preview = result_preview[:500] + "... (truncated)"
            print(f"📦 Response data type: {type(result)}, preview: {result_preview}")
            return result if result is not None else {}
        except requests.exceptions.JSONDecodeError as e:
            print(f"JSON decode error for {endpoint}: {e}")
            print(f"Response text: {response.text[:500] if 'response' in locals() else 'No response'}")
            return {}
        except requests.exceptions.RequestException as e:
            print(f"API request failed: {endpoint} - {e}")
            return {}
        except Exception as e:
            print(f"Unexpected error in API request: {endpoint} - {e}")
            return {}

    def _sanitize_cast_list(self, casts: Any) -> List[Dict[str, Any]]:
        """Ensure cast payloads are iterable dictionaries"""
        if not isinstance(casts, list):
            return []
        return [cast for cast in casts if isinstance(cast, dict)]

    def _extract_content_themes(self, casts: List[Dict]) -> Dict[str, Any]:
        """Extract content themes from casts"""
        themes = {
            "defi_finance": 0,
            "nft_art": 0,
            "trading": 0,
            "technology": 0,
            "social": 0,
            "gaming": 0,
            "other": 0
        }

        theme_keywords = {
            "defi_finance": ["defi", "yield", "liquidity", "staking", "farming", "protocol", "dao", "finance"],
            "nft_art": ["nft", "art", "collectible", "mint", "rarible", "opensea", "foundation", "digital art"],
            "trading": ["buy", "sell", "trade", "price", "market", "bull", "bear", "trading"],
            "technology": ["blockchain", "crypto", "ethereum", "base", "layer2", "scaling", "web3"],
            "social": ["community", "social", "network", "friends", "connect", "farcaster"],
            "gaming": ["game", "gaming", "play", "metaverse", "virtual", "gaming"]
        }

        for cast in casts:
            text = cast.get("text", "").lower()
            theme_found = False

            for theme, keywords in theme_keywords.items():
                if any(keyword in text for keyword in keywords):
                    themes[theme] += 1
                    theme_found = True
                    break

            if not theme_found:
                themes["other"] += 1

        return themes

    def _extract_trending_topics(self, casts: List[Dict]) -> List[Dict]:
        """Extract trending topics from casts"""
        topics = {}

        for cast in casts:
            text = cast.get("text", "").lower()
            # Extract hashtags
            hashtags = re.findall(r'#(\w+)', text)
            for hashtag in hashtags:
                topics[hashtag] = topics.get(hashtag, 0) + 1

        # Return top topics
        sorted_topics = sorted(topics.items(), key=lambda x: x[1], reverse=True)
        return [{"topic": topic, "mentions": count} for topic, count in sorted_topics[:10]]

    def _analyze_engagement_patterns(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze engagement patterns"""
        total_likes = sum(cast.get("reactions", {}).get("likes_count", 0) for cast in casts)
        total_recasts = sum(cast.get("reactions", {}).get("recasts_count", 0) for cast in casts)
        total_replies = sum(cast.get("replies", {}).get("count", 0) for cast in casts)

        avg_likes = total_likes / len(casts) if casts else 0
        avg_recasts = total_recasts / len(casts) if casts else 0
        avg_replies = total_replies / len(casts) if casts else 0

        return {
            "total_likes": total_likes,
            "total_recasts": total_recasts,
            "total_replies": total_replies,
            "avg_likes_per_cast": round(avg_likes, 2),
            "avg_recasts_per_cast": round(avg_recasts, 2),
            "avg_replies_per_cast": round(avg_replies, 2),
            "total_engagement": total_likes + total_recasts + total_replies
        }

    def _calculate_user_engagement_stats(self, users: List[Dict]) -> Dict[str, Any]:
        """Calculate user engagement statistics"""
        if not users:
            return {}

        total_engagement = sum(user.get("total_engagement", 0) for user in users)
        avg_engagement = total_engagement / len(users)

        return {
            "total_engagement_all_users": total_engagement,
            "avg_engagement_per_user": round(avg_engagement, 2),
            "max_engagement": max(user.get("total_engagement", 0) for user in users),
            "engagement_distribution": {
                "high": len([u for u in users if u.get("total_engagement", 0) > avg_engagement * 1.5]),
                "medium": len([u for u in users if avg_engagement * 0.5 <= u.get("total_engagement", 0) <= avg_engagement * 1.5]),
                "low": len([u for u in users if u.get("total_engagement", 0) < avg_engagement * 0.5])
            }
        }

    def _analyze_channel_diversity(self, users: List[Dict]) -> Dict[str, Any]:
        """Analyze channel diversity among users"""
        all_channels = set()
        for user in users:
            all_channels.update(user.get("channels", []))

        return {
            "unique_channels": len(all_channels),
            "channels_list": list(all_channels)[:10],  # Top 10 channels
            "avg_channels_per_user": round(sum(len(user.get("channels", [])) for user in users) / len(users), 2)
        }

    def _analyze_content_patterns(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze content patterns"""
        total_casts = len(casts)
        if total_casts == 0:
            return {}

        # Content length analysis
        lengths = [len(cast.get("text", "")) for cast in casts]
        avg_length = sum(lengths) / len(lengths)

        # Hashtag analysis
        hashtag_count = sum(1 for cast in casts if "#" in cast.get("text", ""))

        # Mention analysis
        mention_count = sum(1 for cast in casts if "@" in cast.get("text", ""))

        # Link analysis
        link_count = sum(1 for cast in casts if "http" in cast.get("text", ""))

        # Question analysis
        question_count = sum(1 for cast in casts if "?" in cast.get("text", ""))

        return {
            "avg_cast_length": round(avg_length, 1),
            "casts_with_hashtags": hashtag_count,
            "casts_with_mentions": mention_count,
            "casts_with_links": link_count,
            "casts_with_questions": question_count,
            "content_length_distribution": {
                "short": len([l for l in lengths if l < 50]),
                "medium": len([l for l in lengths if 50 <= l < 200]),
                "long": len([l for l in lengths if l >= 200])
            }
        }

    def _analyze_temporal_patterns(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze temporal patterns in content"""
        if not casts:
            return {}

        # Group by hour
        hourly_distribution = {}
        now = datetime.now()

        for cast in casts:
            timestamp_str = cast.get("timestamp")
            if timestamp_str:
                try:
                    # Handle different timestamp formats
                    if timestamp_str.endswith('Z'):
                        timestamp = datetime.fromisoformat(timestamp_str[:-1])
                    else:
                        timestamp = datetime.fromisoformat(timestamp_str)

                    hour = timestamp.hour
                    hourly_distribution[hour] = hourly_distribution.get(hour, 0) + 1
                except:
                    continue

        if not hourly_distribution:
            return {"error": "No valid timestamps found"}

        peak_hour = max(hourly_distribution.keys(), key=lambda x: hourly_distribution[x])

        return {
            "hourly_activity": hourly_distribution,
            "peak_hour": peak_hour,
            "total_hours_active": len(hourly_distribution),
            "peak_hour_casts": hourly_distribution[peak_hour],
            "activity_score": len(hourly_distribution) * sum(hourly_distribution.values()) // 24  # Rough activity score
        }

    def _analyze_content_sentiment(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze content sentiment"""
        positive_words = ["bullish", "moon", "pump", "up", "good", "great", "excellent", "amazing", "love", "best", "win"]
        negative_words = ["bearish", "dump", "down", "bad", "terrible", "awful", "hate", "worst", "lose", "crash"]

        sentiment_scores = []
        for cast in casts:
            text = cast.get("text", "").lower()
            pos_count = sum(1 for word in positive_words if word in text)
            neg_count = sum(1 for word in negative_words if word in text)

            if pos_count > neg_count:
                sentiment = "positive"
            elif neg_count > pos_count:
                sentiment = "negative"
            else:
                sentiment = "neutral"

            sentiment_scores.append(sentiment)

        return {
            "positive": sentiment_scores.count("positive"),
            "negative": sentiment_scores.count("negative"),
            "neutral": sentiment_scores.count("neutral"),
            "overall_sentiment": "positive" if sentiment_scores.count("positive") > sentiment_scores.count("negative") else "negative" if sentiment_scores.count("negative") > sentiment_scores.count("positive") else "neutral"
        }

    def _analyze_engagement_by_type(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze engagement by content type"""
        types = {
            "questions": [],
            "statements": [],
            "announcements": [],
            "discussions": []
        }

        for cast in casts:
            text = cast.get("text", "").lower()
            engagement = cast.get("reactions", {}).get("likes_count", 0)

            if "?" in text:
                types["questions"].append(engagement)
            elif any(word in text for word in ["announcing", "launching", "new", "update", "breaking"]):
                types["announcements"].append(engagement)
            elif any(word in text for word in ["what", "how", "why", "think", "opinion"]):
                types["discussions"].append(engagement)
            else:
                types["statements"].append(engagement)

        # Calculate averages
        return {
            type_name: round(sum(scores) / len(scores), 2) if scores else 0
            for type_name, scores in types.items()
        }

    def _analyze_channel_distribution(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze channel distribution"""
        channel_counts = {}
        for cast in casts:
            channel_name = (cast.get("channel") or {}).get("name") or "general"
            channel_counts[channel_name] = channel_counts.get(channel_name, 0) + 1

        sorted_channels = sorted(channel_counts.items(), key=lambda x: x[1], reverse=True)
        return {
            "total_channels": len(channel_counts),
            "top_channels": [{"name": ch, "casts": count} for ch, count in sorted_channels[:10]],
            "channel_concentration": round(sorted_channels[0][1] / sum(channel_counts.values()) * 100, 2) if sorted_channels else 0
        }

    def _extract_trending_tokens(self, casts: List[Dict]) -> List[Dict]:
        """Extract trending tokens from casts with improved logic"""
        token_mentions = {}

        for cast in casts:
            text = cast.get("text", "").upper()

            # Look for $TOKEN patterns
            dollar_tokens = re.findall(r'\$([A-Z]{2,10})', text)
            for token in dollar_tokens:
                if token in self.known_tokens or len(token) >= 3:
                    token_mentions[token] = token_mentions.get(token, 0) + 1

            # Look for token symbols without $ prefix
            words = re.findall(r'\b[A-Z]{2,10}\b', text)
            for word in words:
                if word in self.known_tokens:
                    token_mentions[word] = token_mentions.get(word, 0) + 1

        # Filter out common words that aren't tokens
        exclude_words = {"THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER", "WAS", "ONE", "OUR", "HAD", "BY", "HOT", "BUT", "SOME", "WHAT", "THERE", "WHEN", "YOUR", "HOW", "EACH", "WHICH", "THEIR", "TIME", "WILL", "ABOUT", "WOULD", "THERE", "COULD", "OTHER"}

        filtered_tokens = {k: v for k, v in token_mentions.items() if k not in exclude_words}

        # Return top mentioned tokens
        sorted_tokens = sorted(filtered_tokens.items(), key=lambda x: x[1], reverse=True)
        return [{"symbol": token, "mentions": count} for token, count in sorted_tokens[:15]]

    def _extract_trending_nfts(self, casts: List[Dict]) -> List[Dict]:
        """Extract trending NFTs from casts with improved logic"""
        nft_mentions = {}

        nft_keywords = ["nft", "collectible", "art", "mint", "collection", "drop", "rarible", "opensea", "foundation", "nfts"]

        for cast in casts:
            text = cast.get("text", "").lower()
            if any(keyword in text for keyword in nft_keywords):
                # Look for potential NFT names after NFT keywords
                words = text.split()
                for i, word in enumerate(words):
                    if word in nft_keywords and i < len(words) - 1:
                        # Get next few words as potential NFT name
                        potential_name = " ".join(words[i+1:i+4]).strip('.,!?').title()
                        if len(potential_name) > 2 and not potential_name.isdigit():
                            nft_mentions[potential_name] = nft_mentions.get(potential_name, 0) + 1

                # Also look for #NFT mentions
                hashtags = re.findall(r'#(\w+)', text)
                for hashtag in hashtags:
                    if 'nft' in hashtag.lower():
                        nft_mentions[hashtag.title()] = nft_mentions.get(hashtag.title(), 0) + 1

        sorted_nfts = sorted(nft_mentions.items(), key=lambda x: x[1], reverse=True)
        return [{"name": nft, "mentions": count} for nft, count in sorted_nfts[:10]]

    def _analyze_market_sentiment(self, casts: List[Dict]) -> Dict[str, Any]:
        """Analyze market sentiment from token discussions"""
        bullish_words = ["bullish", "moon", "pump", "up", "buy", "long", "bull", "green", "profit"]
        bearish_words = ["bearish", "dump", "down", "sell", "short", "bear", "red", "loss", "crash"]

        bullish_count = 0
        bearish_count = 0

        for cast in casts:
            text = cast.get("text", "").lower()
            bullish_count += sum(1 for word in bullish_words if word in text)
            bearish_count += sum(1 for word in bearish_words if word in text)

        total_signals = bullish_count + bearish_count

        if total_signals == 0:
            sentiment = "neutral"
            confidence = 0
        else:
            if bullish_count > bearish_count:
                sentiment = "bullish"
                confidence = round((bullish_count - bearish_count) / total_signals * 100, 2)
            elif bearish_count > bullish_count:
                sentiment = "bearish"
                confidence = round((bearish_count - bullish_count) / total_signals * 100, 2)
            else:
                sentiment = "neutral"
                confidence = 0

        return {
            "overall_sentiment": sentiment,
            "confidence_percentage": confidence,
            "bullish_signals": bullish_count,
            "bearish_signals": bearish_count,
            "total_signals": total_signals
        }

    def _analyze_cross_ecosystem(self, token_casts: List[Dict], nft_casts: List[Dict]) -> Dict[str, Any]:
        """Analyze relationships between token and NFT ecosystems"""
        # Find overlapping authors
        token_authors = set(cast.get("author", {}).get("fid") for cast in token_casts if cast.get("author"))
        nft_authors = set(cast.get("author", {}).get("fid") for cast in nft_casts if cast.get("author"))

        overlap = len(token_authors & nft_authors)
        total_unique = len(token_authors | nft_authors)

        return {
            "overlapping_authors": overlap,
            "total_unique_authors": total_unique,
            "overlap_percentage": round(overlap / total_unique * 100, 2) if total_unique > 0 else 0,
            "token_only_authors": len(token_authors - nft_authors),
            "nft_only_authors": len(nft_authors - token_authors),
            "ecosystem_interaction_score": round(overlap / max(len(token_authors), len(nft_authors), 1) * 100, 2)
        }

    def _calculate_ecosystem_health(self, token_casts: List[Dict], nft_casts: List[Dict]) -> float:
        """Calculate ecosystem health score"""
        total_casts = len(token_casts) + len(nft_casts)
        unique_authors = len(set(
            cast.get("author", {}).get("fid") for cast in token_casts + nft_casts
            if cast.get("author")
        ))

        # Simple health score based on activity and diversity
        activity_score = min(50, total_casts // 10)  # Max 50 points for activity
        diversity_score = min(50, unique_authors // 2)  # Max 50 points for diversity

        return activity_score + diversity_score

    def _test_api_responsiveness(self) -> Dict[str, Any]:
        """Test API responsiveness"""
        import time

        endpoints = ["v2/farcaster/feed/trending", "v2/farcaster/user/bulk", "v2/farcaster/cast/search"]
        results = {}

        for endpoint in endpoints:
            try:
                start_time = time.time()
                params: Dict[str, Any] = {"limit": 5}
                if "user/bulk" in endpoint:
                    params = {"fids": "1,2,3"}
                elif "cast/search" in endpoint:
                    params = {"q": "test", "limit": 5}
                response = self._make_request(endpoint, params)
                end_time = time.time()

                response_time = round((end_time - start_time) * 1000, 2)
                results[endpoint.split('/')[-1]] = {
                    "response_time_ms": response_time,
                    "success": bool(response),
                    "status": "excellent" if response_time < 500 else "good" if response_time < 1000 else "slow"
                }
            except Exception as e:
                results[endpoint.split('/')[-1]] = {
                    "error": str(e),
                    "status": "unhealthy"
                }

        return results

    def _analyze_content_freshness(self) -> Dict[str, Any]:
        """Analyze content freshness"""
        try:
            # Get recent casts
            recent = self._make_request("v2/farcaster/feed/trending", {"limit": 10})
            casts = self._sanitize_cast_list(recent.get("casts", []))

            if not casts:
                return {"error": "No recent casts found"}

            # Calculate freshness metrics
            now = datetime.now()
            timestamps = []

            for cast in casts:
                timestamp_str = cast.get("timestamp")
                if timestamp_str:
                    try:
                        if timestamp_str.endswith('Z'):
                            timestamp = datetime.fromisoformat(timestamp_str[:-1])
                        else:
                            timestamp = datetime.fromisoformat(timestamp_str)
                        timestamps.append(timestamp)
                    except:
                        continue

            if not timestamps:
                return {"error": "No valid timestamps"}

            ages_minutes = [(now - ts).total_seconds() / 60 for ts in timestamps]
            avg_age_minutes = sum(ages_minutes) / len(ages_minutes)

            return {
                "avg_content_age_minutes": round(avg_age_minutes, 2),
                "newest_content_minutes": round(min(ages_minutes), 2),
                "oldest_content_minutes": round(max(ages_minutes), 2),
                "freshness_rating": "excellent" if avg_age_minutes < 30 else "good" if avg_age_minutes < 60 else "stale"
            }

        except Exception as e:
            return {"error": str(e)}

def generate_ecosystem_report(analysis: Dict[str, Any]) -> str:
    """Generate human-readable ecosystem report"""
    lines = []

    # Header
    lines.append("🌐 FARCASTER ECOSYSTEM ANALYSIS REPORT")
    lines.append("=" * 60)
    lines.append(f"Analysis Timestamp: {analysis['metadata']['timestamp']}")
    lines.append(f"Analysis Period: {analysis['metadata']['analysis_period_hours']} hours")
    lines.append("")

    # Platform Overview
    platform = analysis.get("platform_overview", {})
    lines.append("📊 PLATFORM OVERVIEW:")
    lines.append("-" * 25)
    lines.append(f"• Total Channels: {platform.get('channels_count', 0)}")
    lines.append(f"• Sample Casts Analyzed: {platform.get('sample_casts_count', 0)}")

    if platform.get("top_channels"):
        lines.append("• Top Channels:")
        for i, channel in enumerate(platform["top_channels"][:5], 1):
            lines.append(f"  {i}. #{channel['name']}")
            if channel.get('description'):
                desc = channel['description'][:60] + "..." if len(channel['description']) > 60 else channel['description']
                lines.append(f"     {desc}")
    lines.append("")

    # Trending Analysis
    trending = analysis.get("trending_analysis", {})
    lines.append("📈 TRENDING ANALYSIS:")
    lines.append("-" * 25)
    lines.append(f"• Total Trending Casts: {trending.get('total_trending_casts', 0)}")

    themes = trending.get("content_themes", {})
    if themes:
        lines.append("• Content Themes:")
        sorted_themes = sorted(themes.items(), key=lambda x: x[1], reverse=True)
        for theme, count in sorted_themes:
            if count > 0:
                theme_name = theme.replace('_', ' ').title()
                lines.append(f"  - {theme_name}: {count} casts")

    engagement = trending.get("engagement_patterns", {})
    if engagement:
        lines.append("• Engagement Metrics:")
        lines.append(f"  - Total Likes: {engagement.get('total_likes', 0):,}")
        lines.append(f"  - Total Recasts: {engagement.get('total_recasts', 0):,}")
        lines.append(f"  - Total Replies: {engagement.get('total_replies', 0):,}")
        lines.append(f"  - Avg Likes/Cast: {engagement.get('avg_likes_per_cast', 0):.1f}")
        lines.append(f"  - Avg Recasts/Cast: {engagement.get('avg_recasts_per_cast', 0):.1f}")
    lines.append("")

    # Top Casts
    top_casts = trending.get("top_casts", [])
    if top_casts:
        lines.append("🔥 TOP TRENDING CASTS:")
        lines.append("-" * 25)
        for i, cast in enumerate(top_casts[:5], 1):
            lines.append(f"{i}. @{cast['author']} ({cast['likes']}❤️, {cast['recasts']}🔄)")
            lines.append(f"   \"{cast['text']}\"")
        lines.append("")

    # User Ecosystem
    users = analysis.get("user_ecosystem", {})
    lines.append("👥 USER ECOSYSTEM:")
    lines.append("-" * 25)
    lines.append(f"• Total Unique Users Analyzed: {users.get('total_unique_users_analyzed', 0)}")

    top_influencers = users.get("top_influencers", [])
    if top_influencers:
        lines.append("• Top Influencers by Engagement:")
        for i, user in enumerate(top_influencers[:8], 1):
            casts_in_sample = user.get("casts_in_sample", user.get("casts_count", 0))
            lines.append(f"  {i}. @{user['username']} - {user['total_likes']} likes, {casts_in_sample} casts")
    lines.append("")

    # Content Ecosystem
    content = analysis.get("content_ecosystem", {})
    lines.append("📝 CONTENT ECOSYSTEM:")
    lines.append("-" * 25)
    lines.append(f"• Total Casts Analyzed: {content.get('total_casts_analyzed', 0)}")

    patterns = content.get("content_patterns", {})
    if patterns:
        lines.append("• Content Patterns:")
        lines.append(f"  - Average Cast Length: {patterns.get('avg_cast_length', 0):.0f} characters")
        lines.append(f"  - Casts with Hashtags: {patterns.get('casts_with_hashtags', 0)}")
        lines.append(f"  - Casts with Mentions: {patterns.get('casts_with_mentions', 0)}")
        lines.append(f"  - Casts with Links: {patterns.get('casts_with_links', 0)}")

        dist = patterns.get("content_length_distribution", {})
        if dist:
            lines.append("  - Content Length Distribution:")
            lines.append(f"    • Short (<50 chars): {dist.get('short', 0)}")
            lines.append(f"    • Medium (50-200 chars): {dist.get('medium', 0)}")
            lines.append(f"    • Long (>200 chars): {dist.get('long', 0)}")

    temporal = content.get("temporal_distribution", {})
    if temporal and temporal.get("peak_hour") is not None:
        lines.append(f"• Peak Activity Hour: {temporal['peak_hour']:02d}:00")
        lines.append(f"• Hours with Activity: {temporal.get('total_hours_active', 0)}")
    lines.append("")

    # Token/NFT Ecosystem
    token_nft = analysis.get("token_nft_ecosystem", {})
    lines.append("🪙 TOKEN & NFT ECOSYSTEM:")
    lines.append("-" * 30)

    token_discussions = token_nft.get("token_discussions", {})
    lines.append(f"• Token Discussions: {token_discussions.get('total_casts', 0)} casts")
    lines.append(f"• Unique Token Authors: {token_discussions.get('unique_authors', 0)}")

    trending_tokens = token_discussions.get("trending_tokens", [])
    if trending_tokens:
        lines.append("• Trending Token Symbols:")
        for i, token in enumerate(trending_tokens[:5], 1):
            lines.append(f"  {i}. {token['symbol']}: {token['mentions']} mentions")

    nft_discussions = token_nft.get("nft_discussions", {})
    lines.append(f"• NFT Discussions: {nft_discussions.get('total_casts', 0)} casts")
    lines.append(f"• Unique NFT Authors: {nft_discussions.get('unique_authors', 0)}")

    trending_nfts = nft_discussions.get("trending_nfts", [])
    if trending_nfts:
        lines.append("• Trending NFT Topics:")
        for i, nft in enumerate(trending_nfts[:5], 1):
            lines.append(f"  {i}. {nft['name']}: {nft['mentions']} mentions")

    cross_ecosystem = token_nft.get("cross_ecosystem_insights", {})
    if cross_ecosystem:
        lines.append("• Cross-Ecosystem Insights:")
        lines.append(f"  - Authors in Both Token & NFT: {cross_ecosystem.get('overlapping_authors', 0)}")
        lines.append(f"  - Overlap Percentage: {cross_ecosystem.get('overlap_percentage', 0):.1f}%")
        lines.append(f"  - Token-Only Authors: {cross_ecosystem.get('token_only_authors', 0)}")
        lines.append(f"  - NFT-Only Authors: {cross_ecosystem.get('nft_only_authors', 0)}")
    lines.append("")

    # Network Health
    health = analysis.get("network_health", {})
    lines.append("🏥 NETWORK HEALTH:")
    lines.append("-" * 25)
    api_responsiveness = health.get("api_responsiveness", {})
    if api_responsiveness:
        lines.append("• API Responsiveness:")
        for endpoint, metrics in api_responsiveness.items():
            if "response_time_ms" in metrics:
                status = (metrics or {}).get("status")
                if status in {"excellent", "good", "healthy"}:
                    status_icon = "✅"
                elif status == "slow":
                    status_icon = "⚠️"
                else:
                    status_icon = "❌"
                lines.append(f"  {status_icon} {endpoint}: {metrics['response_time_ms']}ms ({metrics.get('status', 'unknown')})")

    freshness = health.get("content_freshness", {})
    if freshness and "avg_content_age_minutes" in freshness:
        freshness_icon = "🟢" if freshness["freshness_rating"] == "excellent" else "🟡" if freshness["freshness_rating"] == "good" else "🔴"
        lines.append(f"{freshness_icon} Content Freshness: {freshness['freshness_rating']} ({freshness['avg_content_age_minutes']:.1f} min avg age)")
    lines.append("")

    # Recommendations
    recommendations = analysis.get("recommendations", [])
    if recommendations:
        lines.append("💡 ECOSYSTEM RECOMMENDATIONS:")
        lines.append("-" * 35)
        for i, rec in enumerate(recommendations, 1):
            lines.append(f"{i}. {rec}")
        lines.append("")

    # Footer
    lines.append("🤖 Generated by x402 MCPVOT Intelligence Protocol v2.1")
    lines.append("🌐 Comprehensive Farcaster Ecosystem Analysis")
    lines.append("#Farcaster #Web3 #Social #Crypto #Ecosystem #Analysis")

    return '\n'.join(lines)

def cast_ecosystem_report_to_farcaster(analysis: Dict[str, Any], signer_uuid: str) -> Dict[str, Any]:
    """Cast ecosystem report to Farcaster"""
    try:
        # Generate the report
        report = generate_ecosystem_report(analysis)

        # Create a concise cast version (Farcaster has character limits)
        cast_text = f"🌐 Farcaster Ecosystem Analysis Report\n\n"
        cast_text += f"📊 Platform: {analysis.get('platform_overview', {}).get('channels_count', 0)} channels\n"
        cast_text += f"📈 Trending: {analysis.get('trending_analysis', {}).get('total_trending_casts', 0)} casts\n"
        cast_text += f"👥 Users: {analysis.get('user_ecosystem', {}).get('total_unique_users_analyzed', 0)} active\n"
        cast_text += f"🪙 Token/NFT: {analysis.get('token_nft_ecosystem', {}).get('token_discussions', {}).get('total_casts', 0)} discussions\n\n"
        cast_text += f"🤖 Generated by x402 MCPVOT Intelligence Protocol v2.1\n"
        cast_text += f"#Farcaster #Web3 #Ecosystem #Analysis"

        # Prepare the cast data
        cast_data = {
            "signer_uuid": signer_uuid,
            "text": cast_text
        }

        # Make the API call to cast
        response = requests.post(
            "https://api.neynar.com/v2/farcaster/cast",
            headers={
                "x-api-key": os.getenv("NEYNAR_API_KEY"),
                "Content-Type": "application/json"
            },
            json=cast_data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print(f"Successfully cast ecosystem report to Farcaster. Cast hash: {result.get('cast', {}).get('hash')}")
            return {
                "success": True,
                "cast_hash": result.get("cast", {}).get("hash"),
                "cast_text": cast_text,
                "timestamp": analysis["metadata"]["timestamp"]
            }
        else:
            print(f"Failed to cast to Farcaster: {response.status_code} - {response.text}")
            return {
                "success": False,
                "error": f"API Error {response.status_code}",
                "details": response.text,
                "cast_text": cast_text
            }

    except Exception as e:
        print(f"Error casting to Farcaster: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "cast_text": cast_text if 'cast_text' in locals() else "Error generating cast text"
        }

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description='Farcaster Ecosystem Analyzer')
    parser.add_argument('--hours', type=int, default=24, help='Hours back to analyze')
    parser.add_argument('--output-json', type=str, help='Save analysis to JSON file')
    parser.add_argument('--output-report', type=str, help='Save human-readable report to file')
    parser.add_argument('--cast-to-farcaster', action='store_true', help='Cast report to Farcaster')

    args = parser.parse_args()

    try:
        analyzer = FarcasterEcosystemAnalyzer()
        analysis = analyzer.analyze_ecosystem(args.hours)

        # Generate human-readable report
        report = generate_ecosystem_report(analysis)

        # Output to console
        print(report)

        # Save to files if requested
        if args.output_json:
            with open(args.output_json, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, indent=2, ensure_ascii=False)
            print(f"\n💾 Analysis saved to: {args.output_json}")

        if args.output_report:
            with open(args.output_report, 'w', encoding='utf-8') as f:
                f.write(report)
            print(f"\n📄 Report saved to: {args.output_report}")

        # Cast to Farcaster if requested
        if args.cast_to_farcaster:
            signer_uuid = os.getenv('NEYNAR_SIGNER_UUID')
            if not signer_uuid:
                print("❌ NEYNAR_SIGNER_UUID environment variable not set")
                sys.exit(1)

            cast_result = cast_ecosystem_report_to_farcaster(analysis, signer_uuid)
            if cast_result["success"]:
                print(f"📡 Farcaster cast successful! Cast hash: {cast_result['cast_hash']}")
            else:
                print(f"❌ Farcaster cast failed: {cast_result.get('error', 'Unknown error')}")
                if cast_result.get("details"):
                    print(f"   Details: {cast_result['details']}")

    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
