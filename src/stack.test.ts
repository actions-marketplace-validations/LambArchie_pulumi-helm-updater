import { getStack } from './stack'

class NoErrorThrownError extends Error {}

const getError = async <TError>(call: () => unknown): Promise<TError> => {
  try {
    await call()

    throw new NoErrorThrownError()
  } catch (error: unknown) {
    return error as TError
  }
}

describe('get stack', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('Exit') })

  test('exits if cannot read specified stack export', async () => {
    const error = await getError(async () => getStack('', 'noExist.yaml'))
    expect(error).not.toBeInstanceOf(NoErrorThrownError)
    expect(error).toHaveProperty('message', 'Exit')
    expect(mockExit).toHaveBeenCalled()
  })
})
