import { reactive } from 'vue'

const state = reactive({
  visible: false,
  message: '' as string,
  resolve: null as null | ((v: boolean) => void)
})

export function useConfirm() {
  function open(message: string): Promise<boolean> {
    state.message = message
    state.visible = true
    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }
  function accept() {
    state.visible = false
    state.resolve?.(true)
    state.resolve = null
  }
  function cancel() {
    state.visible = false
    state.resolve?.(false)
    state.resolve = null
  }
  return { state, open, accept, cancel }
}
