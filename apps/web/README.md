# Backspace

## Getting started

Requirements:

Node version 12

You'll also need to make a firebase admin SDK service account private key: [How to do that](/docs/assets/firebase%20admin%20private%20key.webm)

## Tech Stack

- [Typescript](https://basarat.gitbook.io/typescript/getting-started): The _only_ language we need.
- [Eslint](https://eslint.org/docs/user-guide/getting-started): Linting.

- [Next](https://nextjs.org/docs): React Framework w/ SSR.
- Styling
  - [Tailwind](https://tailwindcss.com/docs/editor-setup): Utility-Class based style system.
  - [Styled Components](https://styled-components.com/docs): CSS in JS framework.
- [Redux](): State management
  - _We have rxjs for a single use case, but that will not stick around._
- [Formik](https://formik.org/docs/overview): Frontend Forms

- [Prisma](https://www.prisma.io/docs/concepts/components/prisma-client): ORM.
- [Supabase](https://supabase.com/docs): Backend as a Service.
- [Firebase](https://www.npmjs.com/package/firebase): Another BaaS, filling in for lacking features in supabase.
- [Stripe](https://stripe.com/docs/api?lang=node): Payment processing.