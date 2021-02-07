import Hooks from 'schemahandler/hooks/hooks'
import { passcode, isValidPasscode, login } from './LoginLogic'
import { Portal } from 'portal-vue/dist/portal-vue.esm'
import { GTextField, GIcon } from 'pos-vue-framework'
import PosLoginKeyboard from '../pos-shared-components/POSInput/PosLoginKeyboard';
import { useRouter } from 'vue-router';

function loginTextFieldFactory() {
  const hooks = new Hooks()

  const fn = (scopeAttr) => ({
    name: 'LoginTextField',
    setup() {
      hooks.emit('password', passcode)
      const attrs = {
        ...scopeAttr ? { [scopeAttr]: '' } : {}
      }

      let renderFn = () => {
        return <Portal to="login-text-field">
          <GTextField type="password" v-model={passcode.value} {...attrs}>
            {{
              'input-message': () => !isValidPassword.value && (
                <div class="invalid-passcode-message">
                  <GIcon color="red" size="16px" style="margin-right: 8px">mdi-close-circle</GIcon>
                  <p style="color: #F44336;"/>
                </div>
              )
            }}
          </GTextField>
        </Portal>
      }

      hooks.emit('r:loginTextField', renderFn, passcode, isValidPasscode, e => eval(e))

      return renderFn
    }
  })

  return { hooks, fn }
}

function loginKeyboardFactory() {
  const hooks = new Hooks()

  const fn = (scopeAttr) => ({
    name: 'LoginKeyboard',
    setup() {
      const router = useRouter()

      async function _login(passcode) {
        const result = await login(passcode)
        if (result) router.push('/pos2-dashboard')
      }

      // add render hooks to theme/customize ui
      return () => <>
        <Portal to='login-keyboard'>
          <PosLoginKeyboard v-model={passcode.value} onLogin={_login} { ...scopeAttr ? { [scopeAttr]: '' } : {} }/>
        </Portal>
      </>
    }
  })

  return { hooks, fn }
}

export { loginTextFieldFactory, loginKeyboardFactory }
