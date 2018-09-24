// See https://atom.io/docs/latest/creating-a-package#menus for more details
({
  'context-menu': {
    'atom-text-editor': [
      {
        'label': 'Search Everywhere Toggle',
        'command': 'search-everywhere:toggle'
      },
      {
        'label': 'Search Everywhere Toggle Last Search',
        'command': 'search-everywhere:toggleLastSearch'
      }
    ]
  },
  'menu': [
    {
      'label': 'Packages',
      'submenu': [{
        'label': 'Search Everywhere',
        'submenu': [
          {
            'label': 'Toggle',
            'command': 'search-everywhere:toggle'
          },
          {
            'label': 'Toggle Last Search',
            'command': 'search-everywhere:toggleLastSearch'
          }
        ]
      }
      ]
    }
  ]
});
