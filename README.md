![](https://raw.githubusercontent.com/ScaleLeap/amazon-mws-api-sdk/master/docs/assets/header.png)

📦 @scaleleap/amazon-mws-api-sdk
===================================

A template for creating TypeScript applications.

---

This package does one, two and three.

## Download & Installation

```sh
$ npm i -s @scaleleap/amazon-mws-api-sdk
```

## Contributing

This repository uses [Conventional Commit](https://www.conventionalcommits.org/) style commit messages.

Testing uses [global-agent](https://github.com/gajus/global-agent) to allow for request proxying/interception
for debugging.

1. Use [Charles.app](https://www.charlesproxy.com), or a similar MiM tool to proxy the requests.
2. Set the proxy server via `export GLOBAL_AGENT_HTTP_PROXY=http://127.0.0.1:8080`
3. Run tests `npm t` and you'll be able to inspect traffic going through.

## Authors or Acknowledgments

* Roman Filippov ([Scale Leap](https://www.scaleleap.com))
* Stanislav Iliev ([gigobyte](https://github.com/gigobyte))

## License

This project is licensed under the MIT License.

## Badges

[![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ScaleLeap/amazon-mws-api-sdk/CI)](https://github.com/ScaleLeap/amazon-mws-api-sdk/actions)
[![NPM](https://img.shields.io/npm/v/@scaleleap/amazon-mws-api-sdk)](https://npm.im/@scaleleap/amazon-mws-api-sdk)
[![License](https://img.shields.io/npm/l/@scaleleap/amazon-mws-api-sdk)](./LICENSE)
[![Semantic Release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)