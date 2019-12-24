const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Query {
    me: User
    userSites: [UserSite]
    sitePages(input: SitePagesInput!): SitePagesPayload
    siteReports(input: SiteReportsInput): SiteReportsPayload
    subscriptionPlans: [Plan]
  }

  type Mutation {
    signUp(input: SignUpInput!): SignUpPayload
    signIn(input: SignInInput!): SignInPayload
    signOut: SuccessMessage
    addUserSite(input: AddUserSiteInput!): AddUserSitePayload
    updateUserSite(input: UpdateUserSiteInput!): UpdateUserSitePayload
    deleteUserSite(input: DeleteUserSiteInput): SuccessMessage
    requestReset(input: RequestResetInput!): SuccessMessage
    resetPassword(input: ResetPasswordInput!): User!
    updateUserPassword(input: UpdatePasswordInput!): UpdatePasswordPayload
    createStripeSession(
      input: CreateStripeSessionInput!
    ): CreateStripeSessionPayload
    updateStripeSubscription(
      input: UpdateStripeSubscriptionInput!
    ): SuccessMessage
    deleteStripeSubscription: SuccessMessage
    runSiteReport(input: RunSiteReportInput!): RunSiteReportPayload
  }

  input RunSiteReportInput {
    hostname: String
  }

  input CreateStripeSessionInput {
    stripePlanId: String
  }

  type CreateStripeSessionPayload {
    stripeSessionId: String
  }

  input UpdateStripeSubscriptionInput {
    stripePlanId: String
  }

  input UpdatePasswordInput {
    currentPassword: String
    newPassword: String
  }

  type UpdatePasswordPayload {
    message: String
  }

  input UpdateUserSiteInput {
    hostname: String!
    associatesApiKey: String!
    minimumReview: Float!
  }

  type UpdateUserSitePayload {
    UserSite: UserSite
  }

  type User {
    id: String
    firstName: String
    lastName: String
    email: String
    plan: Plan
    creditsRemaining: Int
  }

  type Plan {
    name: String
    level: Int
    creditsPerMonth: Int
    stripePlanId: String
    pricePerMonth: Float
  }

  type UserSite {
    hostname: String
    associatesApiKey: String
    minimumReview: Float
    runningReport: Boolean
  }

  input SignUpInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  type SignUpPayload {
    id: String
    email: String
  }

  input SignInInput {
    email: String!
    password: String!
  }

  type SignInPayload {
    token: String
    user: User
  }

  input AddUserSiteInput {
    hostname: String!
    apiKey: String!
    minimumReview: Float!
  }

  input DeleteUserSiteInput {
    hostname: String!
  }

  type AddUserSitePayload {
    UserSite: UserSite
  }

  type SuccessMessage {
    message: String
  }

  input RequestResetInput {
    email: String!
  }

  input ResetPasswordInput {
    resetToken: String!
    password: String!
    confirmPassword: String!
  }

  type RunSiteReportPayload {
    creditsRemaining: Int
  }

  type UserSitesPayload {
    userSites: [UserSite]
  }

  input SitePagesInput {
    hostname: String
  }

  type SitePagesPayload {
    site: Site
  }

  input SiteReportsInput {
    domain: String
  }

  type SiteReportsPayload {
    reports: [Report]
  }

  type Site {
    pages: [Page]
    hostname: String
    sitemapUrl: String
  }

  type Page {
    url: String!
    pageTitle: String
    wordCount: Int
    links: [Link]
    site: Site
  }

  type Link {
    page: Page
    href: String
    affiliateTagged: Boolean
    affiliateTagName: String
    anchorText: String
  }

  type Report {
    domain: String
    createdAt: String
    fileUrl: String
  }
`;

module.exports = typeDefs;
