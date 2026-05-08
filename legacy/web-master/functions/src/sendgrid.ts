// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

export const sendWelcome = (to: string) => {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  console.log('Sending Welcome');

  const msg = {
    to, // Change to your recipient
    from: {
      name: 'Faiz from Backspace',
      email: 'faiz@backspacethat.com',
    },
    templateId: 'd-feb6db8b61034f128489e54d474bd23b',
    dynamic_template_data: {
      // subject: 'Testing Templates',
      // name: 'Some One',
      // text: 'Denver',
    },
  };
  
  return sgMail
    .send(msg)
    .then((response: any) => {
      console.log(response[0].statusCode);
      // console.log(response[0].headers);
    })
    .catch((error: any) => {
      console.error(error);
    });
};


export default sendWelcome;