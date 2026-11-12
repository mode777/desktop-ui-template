# Third-party notices

This project is MIT licensed. It depends on the following third-party packages.
The published `vscode-workbench` tarball does not vendor their source;
consumers install the declared runtime and peer dependencies and receive each
package's own license.

## Distributed dependencies

| Package                     | Version range           | License   | Role                                                                 |
| --------------------------- | ----------------------- | --------- | -------------------------------------------------------------------- |
| `react`                     | `^19.3.1` / peer `>=19` | MIT       | Peer dependency and runtime for the React primitives and preset.     |
| `react-dom`                 | `^19.3.1` / peer `>=19` | MIT       | Peer dependency for rendering React components.                      |
| `zustand`                   | `^5.1.0`                | MIT       | Runtime dependency of the optional preset store and its persistence. |
| `@vscode-elements/elements` | `^2.5.1` / peer `<3`    | MIT       | Peer dependency providing the vscode-elements custom elements.       |
| `@vscode/codicons`          | `^0.0.45`               | CC-BY-4.0 | Icon font and styles used by the template and example applications.  |

`@vscode-elements/elements` also installs its own runtime dependencies (`lit`
and `@lit/context`, both MIT). Their license files ship with those packages and
are not bundled into this repository's tarball.

## Codicons attribution

The template and example applications load Codicon assets generated from
[`microsoft/vscode-codicons`](https://github.com/microsoft/vscode-codicons).

- **Icons:** Copyright Microsoft Corporation, licensed under
  [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
  The full license text is in `@vscode/codicons/LICENSE`.
- **Code:** Copyright Microsoft Corporation, licensed under the MIT License.
  The full license text is in `@vscode/codicons/LICENSE-CODE`.

The published workbench package does not include the Codicon font or its
stylesheet. If you redistribute the template or an example build, keep this
attribution and the upstream license files with the assets.

## Reporting

If you believe a dependency or attribution is missing, open an issue at
[github.com/mode777/desktop-ui-template/issues](https://github.com/mode777/desktop-ui-template/issues).
