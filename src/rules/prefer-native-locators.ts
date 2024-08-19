import { getStringValue, isPageMethod } from '../utils/ast'
import { createRule } from '../utils/createRule'

export default createRule({
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') return
        const method = getStringValue(node.callee.property)
        const query = getStringValue(node.arguments[0])
        const isLocator = isPageMethod(node, 'locator') || method === 'locator'
        if (!isLocator) return

        // If it's something like `page.locator`, just replace the `.locator` part
        const start =
          node.callee.type === 'MemberExpression'
            ? node.callee.property.range![0]
            : node.range![0]
        const end = node.range![1]
        const rangeToReplace: [number, number] = [start, end]

        const ariaLabelPattern = /^\[aria-label=['"](.+?)['"]\]$/
        const labelMatch = query.match(ariaLabelPattern)
        if (labelMatch) {
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange(
                rangeToReplace,
                `getByLabel("${labelMatch[1]}")`,
              )
            },
            messageId: 'unexpectedLabelQuery',
            node,
          })
        }

        const rolePattern = /^\[role=['"](.+?)['"]\]$/
        const roleMatch = query.match(rolePattern)
        if (roleMatch) {
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange(
                rangeToReplace,
                `getByRole("${roleMatch[1]}")`,
              )
            },
            messageId: 'unexpectedRoleQuery',
            node,
          })
        }

        const placeholderPattern = /^\[placeholder=['"](.+?)['"]\]$/
        const placeholderMatch = query.match(placeholderPattern)
        if (placeholderMatch) {
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange(
                rangeToReplace,
                `getByPlaceholder("${placeholderMatch[1]}")`,
              )
            },
            messageId: 'unexpectedPlaceholderQuery',
            node,
          })
        }

        const altTextPattern = /^\[alt=['"](.+?)['"]\]$/
        const altTextMatch = query.match(altTextPattern)
        if (altTextMatch) {
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange(
                rangeToReplace,
                `getByAltText("${altTextMatch[1]}")`,
              )
            },
            messageId: 'unexpectedAltTextQuery',
            node,
          })
        }

        const titlePattern = /^\[title=['"](.+?)['"]\]$/
        const titleMatch = query.match(titlePattern)
        if (titleMatch) {
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange(
                rangeToReplace,
                `getByTitle("${titleMatch[1]}")`,
              )
            },
            messageId: 'unexpectedTitleQuery',
            node,
          })
        }

        // TODO: Add support for custom test ID attribute
        const testIdAttributeName = 'data-testid'
        const testIdPattern = new RegExp(
          `^\\[${testIdAttributeName}=['"](.+?)['"]\\]`,
        )
        const testIdMatch = query.match(testIdPattern)
        if (testIdMatch) {
          context.report({
            fix(fixer) {
              return fixer.replaceTextRange(
                rangeToReplace,
                `getByTestId("${testIdMatch[1]}")`,
              )
            },
            messageId: 'unexpectedTestIdQuery',
            node,
          })
        }
      },
    }
  },
  meta: {
    docs: {
      category: 'Best Practices',
      description: 'Prefer native locator functions',
      recommended: false,
      url: 'https://github.com/playwright-community/eslint-plugin-playwright/tree/main/docs/rules/prefer-native-locators.md',
    },
    fixable: 'code',
    messages: {
      unexpectedAltTextQuery: 'Use .getByAltText() instead',
      unexpectedLabelQuery: 'Use .getByLabel() instead',
      unexpectedPlaceholderQuery: 'Use .getByPlaceholder() instead',
      unexpectedRoleQuery: 'Use .getByRole() instead',
      unexpectedTestIdQuery: 'Use .getByTestId() instead',
      unexpectedTitleQuery: 'Use .getByTitle() instead',
    },
    schema: [],
    type: 'suggestion',
  },
})
