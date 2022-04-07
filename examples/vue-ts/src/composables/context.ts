import { inject, InjectionKey, provide } from 'vue';

export interface CreateContextOptions {
  /**
   * If `true`, Vue will throw if context is `null` or `undefined`
   * In some cases, you might want to support nested context, so you can set it to `false`
   */
  strict?: boolean;
  /**
   * Error message to throw if the context is `undefined`
   */
  errorMessage?: string;
  /**
   * The display name of the context
   */
  name?: string;
}

type CreateContextReturn<T> = [
  provider: (opts: T) => void,
  consumer: (fallback?: T) => T,
  contextSymbol: InjectionKey<T>
];

/**
 * Creates a named context, provider, and hook.
 *
 * @param options create context options
 */
export function createContext<ContextType>(options: CreateContextOptions = {}) {
  const {
    strict = true,
    errorMessage = 'useContext: `context` is undefined. Seems you forgot to wrap component within the Provider',
    name,
  } = options;

  let contextSymbol = Symbol(`${name}Symbol`) as InjectionKey<ContextType>;

  function Provider(payload: ContextType) {
    provide<ContextType>(contextSymbol, payload);
  }

  function useContext(fallback: ContextType | null = null) {
    const context = inject(contextSymbol, fallback);

    if (!context && strict) {
      throw new Error(errorMessage);
    }

    return context;
  }

  return [
    Provider,
    useContext,
    contextSymbol,
  ] as CreateContextReturn<ContextType>;
}
