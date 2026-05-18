// Top-of-feed composer surface. Thin wrapper around the unified
// Composer component — same form body the modal mounts, just without
// the modal chrome. One source of truth for posting.

import React from 'react';

import Composer from 'components/CreatePost/Composer';

const InlineCompose: React.FC = () => <Composer variant="inline" />;

export default InlineCompose;
