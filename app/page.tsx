"use client";

import { useState } from "react";
import {
  BodyText,
  Button,
  ButtonLink,
  Icon,
  Modal,
  ModalContent,
  ModalHeader,
} from "@/ui";
import { useAccountAbstraction } from "../context/accountAbstraction";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import { WETH, XDAI, tokensList } from "../constants";

export default function Home() {
  const [tokenAmount, setTokenAmount] = useState("");
  const [sellToken, setSellToken] = useState(XDAI);
  const [buyToken, setBuyToken] = useState(WETH);
  const [modalOpen, setModalOpen] = useState(false);
  const [tokenSelection, setTokenSelection] = useState("sell");
  const [isLoading, setLoading] = useState(false);
  const [transaction, setTransatcion] = useState();
  const [error, setError] = useState(false);
  const {
    isAuthenticated,
    loginWeb3Auth,
    logoutWeb3Auth,
    relayTransaction,
    setChainId,
    setSafeSelected,
    safes,
    chainId,
    isRelayerLoading,
    openStripeWidget,
    closeStripeWidget,
    safeSelected,
    safeBalance,
    otherBalances,
  } = useAccountAbstraction();

  const swapParams = {
    src: sellToken.address, // Token address of XDAI
    dst: buyToken.address, // Token address of WETH
    amount: parseUnits(tokenAmount || "0", sellToken.decimals).toString(), // Amount of 1INCH to swap (in wei)
    from: safeSelected,
    slippage: 1, // Maximum acceptable slippage percentage for the swap (e.g., 1 for 1%)
    disableEstimate: false, // Set to true to disable estimation of swap details
    allowPartialFill: false, // Set to true to allow partial filling of the swap order
  };

  const apiBaseUrl = "/api";

  function apiRequestUrl(method: string, queryParams: any) {
    return (
      apiBaseUrl + method + "?" + new URLSearchParams(queryParams).toString()
    );
  }

  const allowanceTransaction = async () => {
    if (tokenAmount <= "0" || !isAuthenticated) return;

    setLoading(true);
    setTransatcion(undefined);
    setError(false);

    if (sellToken !== XDAI) {
      const allowanceResponse = await fetch(
        apiRequestUrl(
          "/approve",
          tokenAmount > "0"
            ? {
                tokenAddress: sellToken.address,
                amount: parseUnits(
                  tokenAmount || "0",
                  sellToken.decimals
                ).toString(),
              }
            : { tokenAddress: sellToken.address }
        )
      );
      const allowanceTx = await allowanceResponse.json();
      try {
        const approveGelatoID = await relayTransaction([
          {
            to: allowanceTx.to,
            data: allowanceTx.data,
            value: allowanceTx.value,
          },
        ]);
        console.log(approveGelatoID);
        console.log(
          `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${approveGelatoID}`
        );

        const interval = setInterval(async () => {
          const response = await fetch(
            `https://relay.gelato.digital/tasks/status/${approveGelatoID}`
          );
          const responseJSON = await response.json();
          console.log(responseJSON);
          if (responseJSON.task.taskState === "ExecSuccess") {
            swapTransaction();
            clearInterval(interval);
          }
          if (responseJSON.task.taskState === "Cancelled") {
            clearInterval(interval);
            throw "Cancelled";
          }
        }, 1000);
      } catch (error) {
        console.error(error);
        setError(true);
        setLoading(false);
        return;
      }
    }
  };

  const swapTransaction = async () => {
    const response = await fetch(apiRequestUrl("/swap", swapParams));
    const transaction = await response.json();
    try {
      const swapGelatoID = await relayTransaction([
        {
          to: transaction.tx.to,
          data: transaction.tx.data,
          value: transaction.tx.value,
        },
      ]);
      console.log(swapGelatoID);
      console.log(
        `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${swapGelatoID}`
      );

      const interval = setInterval(async () => {
        const response = await fetch(
          `https://relay.gelato.digital/tasks/status/${swapGelatoID}`
        );
        const responseJSON = await response.json();
        console.log(responseJSON);
        if (responseJSON.task.taskState === "ExecSuccess") {
          setLoading(false);
          clearInterval(interval);
        }
        if (responseJSON.task.taskState === "Cancelled") {
          clearInterval(interval);
          throw "Cancelled";
        }
      }, 1000);
    } catch (error) {
      console.error(error);
      setError(true);
      setLoading(false);
    }
  };

  const truncatedAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(
      address.length - 4,
      address.length
    )}`;

  return (
    <div>
      <header className="top-0 flex flex-col w-full px-4 border-b border-solid h-nav-height bg-surface-25 border-b-surface-75">
        <nav className="flex items-center w-full h-full justify-end">
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <MobileMenu
                  safeBalance={safeBalance}
                  safeSelected={safeSelected}
                />
                <Button className="whitespace-nowrap" onClick={logoutWeb3Auth}>
                  Log out
                </Button>
              </>
            ) : (
              <Button className="whitespace-nowrap" onClick={loginWeb3Auth}>
                Log in
              </Button>
            )}
          </div>
        </nav>
      </header>
      <main className="px-5">
        <div className="max-w-lg mx-auto my-24 bg-white shadow-2xl rounded-2xl">
          <div className="py-4 border shadow-lg border-surface-50 rounded-2xl">
            <div className="flex items-end justify-between px-5 pb-4 border-b border-surface-50">
              <div className="space-y-1">
                <BodyText>From</BodyText>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setModalOpen(true);
                    setTokenSelection("sell");
                  }}
                >
                  <BodyText>{sellToken.symbol}</BodyText>
                </Button>
              </div>
              <Icon
                name="arrow-left"
                className="flex items-center justify-center w-10 p-2 rotate-180 md:w-16 h-9 bg-surface-50 rounded-2xl"
              />
              <div className="space-y-1">
                <BodyText>To</BodyText>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setModalOpen(true);
                    setTokenSelection("buy");
                  }}
                >
                  <BodyText>{buyToken.symbol}</BodyText>
                </Button>
              </div>
            </div>
            <div className="px-5 py-2 space-y-4">
              <input
                min={0}
                type="number"
                pattern="[0-9]*"
                placeholder="0.0"
                className="w-full py-3 text-4xl font-semibold outline-none text-em-med"
                value={tokenAmount}
                onKeyDown={(evt) =>
                  ["e", "E", "+", "-"].includes(evt.key) && evt.preventDefault()
                }
                onChange={(event) => {
                  setTokenAmount(event.target.value);
                }}
              />
              <BodyText className=" text-end">
                Balance:{" "}
                {sellToken === XDAI
                  ? safeBalance && formatUnits(safeBalance, XDAI.decimals)
                  : otherBalances?.find(
                      (token) => token.symbol === sellToken.symbol
                    ).balance}
              </BodyText>
              {transaction && (
                <div>
                  <ButtonLink
                    href={`https://gnosisscan.io/tx/${transaction}`}
                    target="_blank"
                  >
                    Transaction link
                  </ButtonLink>
                </div>
              )}
              {isAuthenticated ? (
                <Button
                  width="full"
                  size="lg"
                  onClick={() => allowanceTransaction()}
                >
                  {isLoading ? "Swapping..." : "Swap"}
                </Button>
              ) : (
                <Button width="full" size="lg" onClick={loginWeb3Auth}>
                  Log in
                </Button>
              )}
              {error && (
                <BodyText>Something went wrong! Please try again.</BodyText>
              )}
            </div>
          </div>
        </div>
        <Modal isOpen={modalOpen} closeAction={() => setModalOpen(false)}>
          <ModalContent className="mb-5 grid grid-cols-2 gap-4">
            {tokensList.map((token) => (
              <Button
                key={token.address}
                variant="secondary"
                onClick={() => {
                  if (tokenSelection === "sell") {
                    setSellToken(token);
                    if (buyToken === token) {
                      setBuyToken(sellToken);
                    }
                  } else {
                    setBuyToken(token);
                    if (sellToken === token) {
                      setSellToken(buyToken);
                    }
                  }

                  setModalOpen(false);
                }}
                disabled={
                  tokenSelection === "sell"
                    ? token === sellToken
                    : token === buyToken
                }
              >
                <BodyText>{token.symbol}</BodyText>
              </Button>
            ))}
          </ModalContent>
        </Modal>
      </main>
    </div>
  );
}

function MobileMenu({
  safeBalance,
  safeSelected,
}: {
  safeBalance?: string;
  safeSelected?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen(!isOpen);

  return (
    <div className="z-10 flex items-center justify-end w-full gap-4">
      <Button
        variant="secondary"
        iconRight={isOpen ? "close" : "menu"}
        size="icon"
        onClick={toggle}
      >
        <span className={isOpen ? "" : "pr-2"}>{isOpen ? "" : "Account"}</span>
      </Button>
      {isOpen && (
        <>
          <div
            className="fixed bottom-0 left-0 right-0 top-nav-height bg-gray-alpha-75"
            onClick={toggle}
          ></div>
          <div className="absolute left-0 w-full gap-2 px-6 py-2 border-b border-solid rounded-lg bg-surface-25 top-nav-height border-surface-75">
            <div className="flex flex-col space-y-4">
              <BodyText>
                {safeBalance && formatUnits(safeBalance, "18")} XDAI
              </BodyText>
              <BodyText className="break-words">
                Safe address: {safeSelected && safeSelected}
              </BodyText>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
