/*
 * <license header>
 */

import React from 'react';
import { Text } from '@adobe/react-spectrum';
import { register } from '@adobe/uix-guest';
import { extensionId } from './Constants';

// Restrict extension to specific repos.
// Format: 'delivery-pXXX-eYYY.adobeaemcloud.com'
// Empty array = allow any repo (safe for development; populate before deploying to Production).
const allowedRepos = [
  // 'delivery-p12345-e167890.adobeaemcloud.com',
];

function getRepo() {
  const search = new URLSearchParams(window.location.search);
  return search.get('repo');
}

function shouldSkipRegistration(repo) {
  return allowedRepos.length > 0 && !allowedRepos.includes(repo);
}

function ExtensionRegistration() {
  const repo = getRepo();

  if (shouldSkipRegistration(repo)) {
    return <Text>IFrame for integration with Host (Content Hub) — skipped registration: repo not in allowedRepos</Text>;
  }

  const init = async () => {
    // Use `let` (not `const`) so the card / selectionBar onActionClick handlers
    // can reference guestConnection after register() resolves.
    let guestConnection = await register({
      id: extensionId,
      methods: {
        // assetDetails namespace: add custom tab panels to the Asset Details Dialog side rail.
        assetDetails: {
          getTabPanels() {
            return [
              {
                'id': 'asset-details-tab',
                'tooltip': 'Asset Details Tab',
                'icon': 'Extension',
                'title': 'Asset Details Tab',
                'contentUrl': '/#tab-panel',
              },
            ];
          },
        },
        // card namespace: add custom action buttons to asset cards (Assets grid, inside a
        // collection, link-share view) and to collection tiles on the Collections grid.
        card: {
          getActionButtons(actionContext) {
            // actionContext.context: 'assets' | 'collection' | 'collections' | 'share'
            //   'assets'      — asset card on the Assets browse grid
            //   'collection'  — asset card inside an open collection
            //   'collections' — collection tile on the Collections grid (3-dot menu)
            //   'share'       — asset card in a link-share view
            const { context } = actionContext || {};
            const label = context === 'collections' ? 'Collection Action' : 'Card Action';
            return [
              {
                'id': 'card-action',
                'label': label,
                'icon': 'Edit',
              },
            ];
          },
          async onActionClick(resourceType, buttonId, resourceId, actionContext) {
            // resourceType:   'asset' (asset cards) | 'collection' (collection tiles)
            // buttonId:       the `id` from getActionButtons()
            // resourceId:     the asset or collection URN that was clicked
            // actionContext:  { context: 'assets' | 'collection' | 'collections' | 'share' }
            await guestConnection.host.modal.openDialog({
              title: 'Card Action',
              contentUrl: `/#card-action-modal?resourceId=${encodeURIComponent(resourceId)}&resourceType=${encodeURIComponent(resourceType)}`,
              type: 'modal',
              size: 'M',
            });
          },
        },
        // selectionBar namespace: add custom bulk action buttons to the selection bar.
        selectionBar: {
          getActionButtons(actionContext) {
            // actionContext.context: 'assets' | 'collection' | 'collections' | 'share'
            // actionContext.resourceSelection.resources: [{ id }, ...]
            return [
              {
                'id': 'bulk-action',
                'label': 'Bulk Action',
                'icon': 'Download',
              },
            ];
          },
          async onActionClick(buttonId, assetIds) {
            const ids = encodeURIComponent(JSON.stringify(assetIds));
            await guestConnection.host.modal.openDialog({
              title: `Bulk Action (${assetIds.length} asset${assetIds.length !== 1 ? 's' : ''})`,
              contentUrl: `/#selection-bar-modal?assetIds=${ids}`,
              type: 'modal',
              size: 'M',
            });
          },
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (Content Hub)...</Text>;
}

export default ExtensionRegistration;
