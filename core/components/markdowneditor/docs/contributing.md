Before contribution, please read this section carefully.  

## Installation
You can install Markdown Editor easily via [GPM](https://github.com/TheBoxer/Git-Package-Management) or by any other harder way.

Make sure you have NPM, bower, gulp and composer installed.

Run:

- `composer install` from repository root
- `npm install` from `_build/assets`

For building JS/CSS you can use several gulp tasks (run from `_build/assets` directory):

- `gulp watch` - builds all JS & CSS and starts a watcher for JS & CSS
- `gulp build` - builds all JS & CSS 

## Code style
Please follow [PSR-2](http://www.php-fig.org/psr/psr-2/) Coding Style Guide.

## Submitting PR
When submitting a PR copy, paste and fill following template as a PR's description. 

### Template
```
### What does it do ?
Describe the technical changes you did.

### Why is it needed ?
Describe the issue you are solving.

### Related issue(s)/PR(s)
Let us know if this is related to any issue/pull request (see https://github.com/blog/1506-closing-issues-via-pull-requests)
```