"use client";

import { useState } from "react";
import {
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
  function sleep(milliseconds: number) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }
  const swap = async () => {
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
        while (1) {
          sleep(5000);
          const response = await fetch(
            `https://relay.gelato.digital/tasks/status/${approveGelatoID}`
          );
          const responseJSON = await response.json();
          console.log(responseJSON);
          if (responseJSON.task.taskState === "ExecSuccess") break;
          if (responseJSON.task.taskState === "Cancelled") throw "Cancelled";
        }
      } catch (error) {
        console.error(error);
        setError(true);
        setLoading(false);
        return;
      }
    }
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

      while (1) {
        sleep(5000);
        const response = await fetch(
          `https://relay.gelato.digital/tasks/status/${swapGelatoID}`
        );
        const responseJSON = await response.json();
        console.log(responseJSON);
        if (responseJSON.task.transactionHash) {
          setTransatcion(responseJSON.task.transactionHash);
        }
        if (responseJSON.task.taskState === "ExecSuccess") break;
        if (responseJSON.task.taskState === "Cancelled") throw "Cancelled";
      }
    } catch (error) {
      console.error(error);
      setError(true);
      setLoading(false);
    }
    setLoading(false);
  };

  const truncatedAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(
      address.length - 4,
      address.length
    )}`;

  return (
    <main className="">
      <header className="top-0 flex flex-col w-full px-4 border-b border-solid h-nav-height bg-surface-25 border-b-surface-75">
        <nav className="flex items-center w-full h-full justify-end">
          <div className="flex items-center space-x-4">
            <div>{safeBalance && formatUnits(safeBalance, "18")}</div>
            <div>{safeSelected && safeSelected}</div>
            <div>
              {isAuthenticated ? (
                <Button onClick={logoutWeb3Auth}>Log out</Button>
              ) : (
                <Button onClick={loginWeb3Auth}>Log in</Button>
              )}
            </div>
          </div>
        </nav>
      </header>
      <div className="max-w-lg mx-auto my-24 bg-white shadow-2xl rounded-2xl">
        <div className="py-4 border shadow-lg border-surface-50 rounded-2xl">
          <div className="flex items-end justify-between px-5 pb-4 border-b border-surface-50">
            <div className="space-y-1">
              <span>From</span>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalOpen(true);
                  setTokenSelection("sell");
                }}
              >
                {sellToken.symbol}
              </Button>
            </div>
            <Icon
              name="arrow-left"
              className="flex items-center justify-center w-10 p-2 rotate-180 md:w-16 h-9 bg-surface-50 rounded-2xl"
            />
            <div className="space-y-1">
              <span>To</span>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalOpen(true);
                  setTokenSelection("buy");
                }}
              >
                {buyToken.symbol}
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
            <div className=" text-end">
              Balance:{" "}
              {sellToken === XDAI
                ? safeBalance && formatUnits(safeBalance, XDAI.decimals)
                : otherBalances?.find(
                    (token) => token.symbol === sellToken.symbol
                  ).balance}
            </div>
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
              <Button width="full" size="lg" onClick={() => swap()}>
                {isLoading ? "Swapping..." : "Swap"}
              </Button>
            ) : (
              <Button width="full" size="lg" onClick={loginWeb3Auth}>
                Log in
              </Button>
            )}
            {error && <div>Something went wrong! Please try again.</div>}
          </div>
        </div>
      </div>
      <Modal isOpen={modalOpen} closeAction={() => setModalOpen(false)}>
        <ModalContent className="space-y-4">
          {tokensList.map((token) => (
            <Button
              key={token.address}
              variant="secondary"
              onClick={() => {
                if (tokenSelection === "sell") setSellToken(token);
                else setBuyToken(token);

                setModalOpen(false);
              }}
            >
              {token.symbol}
            </Button>
          ))}
        </ModalContent>
      </Modal>
    </main>
  );
}
