import {
  WalletAdapter,
  BaseSignerWalletAdapter,
  WalletError,
} from '@solana/wallet-adapter-base';
import {
  useWallet,
  WalletProvider as BaseWalletProvider,
  // @ts-ignore
} from '@solana/wallet-adapter-react';
import {
  MathWalletAdapter,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
const wallet = new PhantomWalletAdapter();
import React, {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { notify } from '../services/notifications';
import { MetaplexModal } from '../components/MetaplexModal';

export interface WalletModalContextState {
  visible: boolean;
  setVisible: (open: boolean) => void;
}

const Button: React.FunctionComponent = ({ children, ...rest }) => (
  <button {...rest}>{children}</button>
);

export const WalletModalContext = createContext<WalletModalContextState>(
  {} as WalletModalContextState
);

export function useWalletModal(): WalletModalContextState {
  return useContext(WalletModalContext);
}

export const WalletModal: FC = () => {
  const { wallets, wallet: selected, select } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const close = useCallback(() => {
    setVisible(false);
  }, [setVisible]);

  return (
    <MetaplexModal
      className="wallet_selector-modal"
      visible={visible}
      onCancel={close}
    >
      <img
        src="/img/BurntAvatar.svg"
        className="walletSelectorModal__logo"
        alt="Logo"
      />

      <h2 className="walletSelectorModal__title">
        {selected ? 'Change Provider' : 'Connect to Wallet'}
      </h2>

      <p className="walletSelectorModal__subtitle">
        You must be signed in to continue
      </p>

      <br />
      {wallets.map((wallet: any) => {
        return (
          <Button
            // @ts-ignore
            className="walletSelectorModal__button"
            key={wallet.name}
            // type={wallet === selected ? 'primary' : 'ghost'}
            onClick={() => {
              select(wallet.name);
              close();
            }}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              borderRadius: 8,
              height: 60,
              border: 'none',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              color: '#000000',
            }}
          >
            <img
              alt={`${wallet.name}`}
              width={20}
              height={20}
              src={wallet.icon}
              style={{ marginRight: 16 }}
            />
            {wallet.name}
          </Button>
        );
      })}
    </MetaplexModal>
  );
};

export const WalletModalProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { publicKey } = useWallet();
  const [connected, setConnected] = useState(!!publicKey);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (publicKey) {
      const base58 = publicKey.toBase58();
      const keyToDisplay =
        base58.length > 20
          ? `${base58.substring(0, 7)}.....${base58.substring(
              base58.length - 7,
              base58.length
            )}`
          : base58;

      notify({
        message: 'Wallet update',
        description: 'Connected to wallet ' + keyToDisplay,
      });
    }
  }, [publicKey]);

  useEffect(() => {
    if (!publicKey && connected) {
      notify({
        message: 'Wallet update',
        description: 'Disconnected from wallet',
      });
    }
    setConnected(!!publicKey);
  }, [publicKey, connected, setConnected]);

  return (
    <WalletModalContext.Provider
      value={{
        visible,
        setVisible,
      }}
    >
      {children}
      <WalletModal />
    </WalletModalContext.Provider>
  );
};

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const wallets = useMemo(
    () => [
      new MathWalletAdapter(),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  const onError = (error: Error) => {
    if (error.name === 'WalletConnectionError') {
      localStorage.removeItem('walletName');
    }
    notify({
      message: 'Wallet error',
      description: error.message,
    });
  };

  return (
    <BaseWalletProvider wallets={wallets} onError={onError} autoConnect>
      <WalletModalProvider>{children}</WalletModalProvider>
    </BaseWalletProvider>
  );
};

export type WalletSigner = Pick<
  BaseSignerWalletAdapter,
  'publicKey' | 'signTransaction' | 'signAllTransactions'
>;
