// Copyright 2022 NewSocial Inc. - All Rights Reserved
// Unauthorized copying of this file, via any medium is strictly prohibited
// Proprietary and confidential
// Author(s): See Git History

/**
 * Autocomplete doesn't keep the order in which they're defined.\
 *
 * So double check its the value you think it is
 */
enum Zindex {
  ToolTip = 50,
  NavigationBar = 55,
  Search = 60,
  Drawer = 90,
  Modal = 99,
  // Toast, // Toast doesn't need z-index anymore
}

export default Zindex;
