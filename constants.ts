export enum ChainId {
  GNOSIS = 100,
}

export const WETH = {
  address: "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1",
  name: "Wrapped Ether on Gnosis chain",
  symbol: "WETH",
  decimals: 18,
  logoURI: "/assets/images/tokens/weth.png",
  chainId: 100,
};
export const WXDAI = {
  address: "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d",
  name: "Wrapped XDAI",
  symbol: "WXDAI",
  decimals: 18,
  logoURI: "/assets/images/tokens/wxdai.png",
  chainId: 100,
};
export const XDAI = {
  address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  name: "XDAI",
  symbol: "XDAI",
  decimals: 18,
  logoURI: "/assets/images/tokens/wxdai.png",
  chainId: 100,
};
export const USDC = {
  address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
  name: "USD//C on Gnosis",
  symbol: "USDC",
  decimals: 6,
  logoURI: "/assets/images/tokens/usdc.png",
  chainId: 100,
};

export const tokensList = [WETH, XDAI, WXDAI, USDC];
