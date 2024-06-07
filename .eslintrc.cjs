/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-prettier/skip-formatting'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    // prettier关注美观
    'prettier/prettier': [
      'warn',
      {
        singleQuote: true, // 单引号
        semi: false, // 不加分号
        trailingComma: 'none', // 不加对象|数组后面的逗号
        printWidth: 200, // 一行最大字符数
        endOfLine: 'auto' // 换行符号不限制
      }
    ],
    // ESLint关注规范
    'vue/multi-word-component-names': 'off',
    'vue/no-setup-props-destructure': 'off', // 关闭props解构的校验，因为props解构会丢失响应式，但是pinia的storeToRefs是可以解决的
    'no-undef': 'error' // 变量未定义错误提示
  },
  globals: {
    ElMessage: 'readonly',
    ElMessageBox: 'readonly',
    ElLoading: 'readonly',
    // zgis工程自定义
    appVue: 'writable',
    vm: 'writable',
    cxApp: 'writable'
  }
}
