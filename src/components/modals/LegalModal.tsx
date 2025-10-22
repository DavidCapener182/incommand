'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'

interface LegalModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'privacy' | 'terms'
}

export default function LegalModal({ isOpen, onClose, defaultTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Legal Information
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'privacy' | 'terms')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
          </TabsList>

          <div className="mt-6 max-h-[60vh] overflow-y-auto">
            <TabsContent value="privacy" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Privacy Policy
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-4">
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      1. Information We Collect
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We collect information you provide directly to us, such as when you create an account, 
                      use our services, or contact us for support. This includes:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 ml-4 mt-2">
                      <li>Account information (email, company name)</li>
                      <li>Incident data and event information</li>
                      <li>Communication data when you contact us</li>
                      <li>Usage data and analytics</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      2. How We Use Your Information
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We use the information we collect to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 ml-4 mt-2">
                      <li>Provide, maintain, and improve our services</li>
                      <li>Process transactions and send related information</li>
                      <li>Send technical notices, updates, and support messages</li>
                      <li>Respond to your comments and questions</li>
                      <li>Monitor and analyze trends and usage</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      3. Information Sharing
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We do not sell, trade, or otherwise transfer your personal information to third parties 
                      without your consent, except as described in this policy. We may share your information:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 ml-4 mt-2">
                      <li>With your explicit consent</li>
                      <li>To comply with legal obligations</li>
                      <li>To protect our rights and safety</li>
                      <li>In connection with a business transfer</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      4. Data Security
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We implement appropriate security measures to protect your personal information against 
                      unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
                      secure servers, and regular security audits.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      5. Your Rights
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You have the right to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 ml-4 mt-2">
                      <li>Access your personal information</li>
                      <li>Correct inaccurate data</li>
                      <li>Delete your account and data</li>
                      <li>Object to processing of your data</li>
                      <li>Data portability</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      6. Contact Us
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      If you have any questions about this Privacy Policy, please contact us at:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Email: privacy@incommand.app<br />
                      Address: InCommand Ltd, United Kingdom
                    </p>
                  </section>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="prose prose-sm max-w-none dark:prose-invert"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Terms of Service
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                </p>

                <div className="space-y-4">
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      1. Acceptance of Terms
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      By accessing and using inCommand, you accept and agree to be bound by the terms and 
                      provision of this agreement. If you do not agree to abide by the above, please do not 
                      use this service.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      2. Description of Service
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      inCommand is an incident management and event command platform designed for security 
                      and safety operations. Our service includes real-time incident tracking, analytics, 
                      and communication tools for event management teams.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      3. User Accounts
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You are responsible for maintaining the confidentiality of your account credentials 
                      and for all activities that occur under your account. You agree to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 ml-4 mt-2">
                      <li>Provide accurate and complete information</li>
                      <li>Keep your password secure</li>
                      <li>Notify us immediately of any unauthorized use</li>
                      <li>Accept responsibility for all activities under your account</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      4. Acceptable Use
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      You agree not to use the service to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 ml-4 mt-2">
                      <li>Violate any laws or regulations</li>
                      <li>Transmit harmful or malicious code</li>
                      <li>Interfere with the service&apos;s operation</li>
                      <li>Access other users&apos; data without permission</li>
                      <li>Use the service for unauthorized purposes</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      5. Data and Privacy
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your use of the service is also governed by our Privacy Policy. By using the service, 
                      you consent to the collection and use of information as described in the Privacy Policy.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      6. Service Availability
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We strive to maintain high service availability but do not guarantee uninterrupted access. 
                      We may perform maintenance, updates, or modifications that temporarily affect service availability.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      7. Limitation of Liability
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      To the maximum extent permitted by law, inCommand shall not be liable for any indirect, 
                      incidental, special, consequential, or punitive damages, including but not limited to 
                      loss of profits, data, or business opportunities.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      8. Termination
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We may terminate or suspend your account immediately, without prior notice, for conduct 
                      that we believe violates these Terms of Service or is harmful to other users, us, or 
                      third parties, or for any other reason.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      9. Changes to Terms
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      We reserve the right to modify these terms at any time. We will notify users of any 
                      material changes via email or through the service. Your continued use constitutes 
                      acceptance of the modified terms.
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      10. Contact Information
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      For questions about these Terms of Service, please contact us at:
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      Email: legal@incommand.app<br />
                      Address: InCommand Ltd, United Kingdom
                    </p>
                  </section>
                </div>
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
