# PR Description Guard

A Chrome Extension that validates GitHub pull request descriptions to ensure they contain essential sections: "What changed", "Why", and "How it was tested".

## Features

- ✅ Real-time validation as you type
- ✅ Non-intrusive inline warnings
- ✅ Works with GitHub PR templates
- ✅ Dark mode support
- ✅ No data collection (all validation happens locally)

## Installation

### Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Load the `dist` folder as an unpacked extension in Chrome

### Chrome Web Store

Coming soon!

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build

# Package for Chrome Web Store
npm run package
```

## Privacy

This extension does not collect, store, or transmit any user data. All validation happens locally in your browser.

See [PRIVACY.md](./PRIVACY.md) for more details.

## License

MIT
