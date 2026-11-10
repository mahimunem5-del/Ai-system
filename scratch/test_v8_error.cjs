const vm = require('vm');
const context = vm.createContext({});
try {
    vm.runInContext("Object.defineProperty(this, 'initRecentChatsActions', { value: function() {}, writable: false, configurable: true });", context);
    vm.runInContext("function initRecentChatsActions() { console.log('hello'); }\ninitRecentChatsActions();", context);
    console.log('No error in vm');
} catch (e) {
    console.error('V8 RUNTIME ERROR:', e);
}

