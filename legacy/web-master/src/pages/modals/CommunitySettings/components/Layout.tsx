// Copyright 2021 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

type LayoutProps = {
  title: string;
};

const Layout: React.FC<LayoutProps> = ({
  title, children,
}) => {
  return (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  );
};

export default Layout;
