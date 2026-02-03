export const emailTemplates = {
  truckListed: ({ sellerName, truckName, truckId }) => ({
    subject: 'Your truck has been listed',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b4a8a;">Truck Listed Successfully</h2>
        <p>Hi ${sellerName},</p>
        <p>Your truck has been listed on Tulsa Trucks:</p>
        <p style="background: #f8fafc; padding: 12px; border-radius: 8px;">
          <strong>${truckName}</strong>
        </p>
        <p>Your listing is now live. Buyers can view it and submit financing inquiries.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/trucks/${truckId}" style="color: #0b4a8a; text-decoration: none;">View your listing →</a></p>
        <p style="margin-top: 24px;">Want more visibility? <a href="${process.env.NEXT_PUBLIC_BASE_URL}/boost-listing/${truckId}" style="color: #f59e0b;">Boost your listing</a> to appear at the top for just $29.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">Tulsa Trucks - team@tulsatrucksforsale.com</p>
      </div>
    `,
  }),

  truckBoosted: ({ sellerName, truckName, expiresAt }) => ({
    subject: 'Your listing is now featured',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b4a8a;">Payment Received - Listing Boosted</h2>
        <p>Hi ${sellerName},</p>
        <p>Thank you for your payment of <strong>$29</strong>.</p>
        <p>Your listing is now featured:</p>
        <p style="background: #f8fafc; padding: 12px; border-radius: 8px;">
          <strong>${truckName}</strong>
        </p>
        <ul style="color: #64748b;">
          <li>Appears at the top of homepage and listings</li>
          <li>Featured badge on your listing</li>
          <li>Expires: ${expiresAt}</li>
        </ul>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">Tulsa Trucks - team@tulsatrucksforsale.com</p>
      </div>
    `,
  }),

  sellerUpgraded: ({ sellerName, planLabel = 'Pro', expiresAt }) => ({
    subject: `Welcome to ${planLabel} Seller`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b4a8a;">Payment Received - ${planLabel} Seller Plan</h2>
        <p>Hi ${sellerName},</p>
        <p>Thank you for your payment.</p>
        <p>You now have ${planLabel} Seller benefits for 30 days:</p>
        <ul style="color: #64748b;">
          <li>Your listings appear above free sellers</li>
          <li>Upload up to 15 photos per truck (vs 6 for free)</li>
          <li>"${planLabel} Seller" badge on all your listings</li>
          <li>Plan expires: ${expiresAt}</li>
        </ul>
        <p>Start listing trucks with your new benefits!</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">Tulsa Trucks - team@tulsatrucksforsale.com</p>
      </div>
    `,
  }),

  financingConfirmation: ({ buyerName, truckName }) => ({
    subject: 'Thank you for your financing inquiry',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b4a8a;">Financing Inquiry Received</h2>
        <p>Hi ${buyerName},</p>
        <p>We received your financing inquiry for:</p>
        <p style="background: #f8fafc; padding: 12px; border-radius: 8px;">
          <strong>${truckName}</strong>
        </p>
        <h3 style="color: #0b4a8a; font-size: 16px;">What's next?</h3>
        <ul style="color: #64748b;">
          <li>We'll review your application within 1 business day</li>
          <li>We may contact you for additional information</li>
          <li>You'll receive an update via email or phone</li>
        </ul>
        <p>Questions? Contact us at team@tulsatrucksforsale.com</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">Tulsa Trucks - team@tulsatrucksforsale.com</p>
      </div>
    `,
  }),

  emailVerification: ({ verificationUrl }) => ({
    subject: 'Verify your email - Tulsa Trucks',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b4a8a;">Verify Your Email</h2>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}" style="display: inline-block; background: #0b4a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a></p>
        <p style="color: #64748b; font-size: 14px;">This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">Tulsa Trucks - team@tulsatrucksforsale.com</p>
      </div>
    `,
  }),

  adPurchased: ({ buyerEmail, placement }) => ({
    subject: 'Ad Purchase Received - Pending Approval',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0b4a8a;">Payment Received - Ad Purchase</h2>
        <p>Thank you for your payment of <strong>$99</strong>.</p>
        <p>Your ad has been submitted for the <strong>${placement}</strong> placement. It will run for 30 days once approved.</p>
        <p>Our team will review your ad within 1 business day. You will receive an email when it goes live.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">Tulsa Trucks - team@tulsatrucksforsale.com</p>
      </div>
    `,
  }),
};

// Re-export from mailer for backwards compatibility
export { sendEmail } from './mailer';
