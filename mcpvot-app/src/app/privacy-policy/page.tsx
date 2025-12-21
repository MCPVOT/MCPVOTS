import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Privacy Policy - MCPVOT Mini Apps',
    description: 'Privacy policy for MCPVOT Mini Apps - Blockchain Terminal Ecosystem',
}

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>

                <div className="space-y-6 text-gray-300">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">1. Information We Collect</h2>
                        <p className="mb-4">
                            MCPVOT Mini Apps collects information necessary to provide blockchain services,
                            including wallet addresses, transaction data, and usage analytics.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">2. How We Use Your Information</h2>
                        <p className="mb-4">
                            We use collected information to:
                        </p>
                        <ul className="list-disc list-inside ml-4 space-y-2">
                            <li>Provide blockchain terminal services</li>
                            <li>Process transactions on the Base network</li>
                            <li>Improve user experience and app functionality</li>
                            <li>Ensure security and prevent fraud</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">3. Information Sharing</h2>
                        <p className="mb-4">
                            We do not sell, trade, or otherwise transfer your personal information to third parties
                            except as required for blockchain transactions or as necessary to provide our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">4. Data Security</h2>
                        <p className="mb-4">
                            We implement appropriate security measures to protect your personal information
                            against unauthorized access, alteration, disclosure, or destruction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">5. Blockchain Transparency</h2>
                        <p className="mb-4">
                            All transactions on the Base network are publicly visible on the blockchain.
                            We cannot modify or delete this public transaction data.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">6. Contact Us</h2>
                        <p className="mb-4">
                            If you have questions about this Privacy Policy, please contact us at:
                        </p>
                        <p className="text-white">
                            Email: privacy@mcpvot.xyz<br />
                            Support: https://mcpvot.xyz/support
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-white">7. Changes to This Policy</h2>
                        <p className="mb-4">
                            We may update this Privacy Policy from time to time. We will notify users of any
                            material changes through our app or website.
                        </p>
                    </section>

                    <div className="mt-8 pt-8 border-t border-gray-700">
                        <p className="text-sm text-gray-500">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
