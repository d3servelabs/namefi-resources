'use client';

import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Input } from '@/components/ui/shadcn/input';
import { useBuyNfsc } from '@/hooks/use-buy-nfsc';
import useGetNfscExchangeRate from '@/hooks/use-get-nfsc-exchange-rate';
import useNfscBalance from '@/hooks/use-nfsc-balance';
import { AlertCircle, ArrowDown } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { parseEther } from 'viem';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DISPLAY_DECIMALS = 2;
const CALCULATION_DECIMALS = 6;

export default function NFSCSwapDialog(props: Props) {
  const { open, onOpenChange } = props;
  const [amountPay, setAmountPay] = useState('');
  const [amountReceive, setAmountReceive] = useState('');
  const [insufficientBalance, setInsufficientBalance] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { nfscBalance, nativeBalance, isLoading } = useNfscBalance();
  const { data: conversionRate, isLoading: isConversionRateLoading } =
    useGetNfscExchangeRate();
  const { writeContractAsync: exchangeNfsc, isPending } = useBuyNfsc({
    onSuccess: () => {
      console.log('NFSCSwap done');
      toast.success('Successfully Swapped', {
        description: `You have successfully swapped ${amountPay} ETH to ${displayReceiveAmount()} NFSC`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('NFSCSwap error', error);
      setErrorMessage(error?.message || 'An error occurred during the swap');
    },
  });

  // Check if user has sufficient balance
  useEffect(() => {
    if (!nativeBalance || amountPay === '') return;

    try {
      const payAmount = Number.parseFloat(amountPay);
      const nativeBalanceNum = Number.parseFloat(nativeBalance.formatted);

      setInsufficientBalance(payAmount > nativeBalanceNum);

      if (errorMessage) {
        setErrorMessage('');
      }
    } catch (error) {
      console.error('Error checking balance:', error);
    }
  }, [amountPay, nativeBalance, errorMessage]);

  // Calculate the corresponding amount when inputs change
  useEffect(() => {
    if (!conversionRate || conversionRate === '0') return;

    try {
      const rate = Number.parseFloat(conversionRate);

      if (amountPay !== '') {
        const payAmount = Number.parseFloat(amountPay);
        const receiveAmount = (payAmount * rate).toFixed(CALCULATION_DECIMALS);
        setAmountReceive(receiveAmount);
      } else {
        setAmountReceive('');
      }
    } catch (error) {
      console.error('Error calculating amounts:', error);
    }
  }, [amountPay, conversionRate]);

  const handlePayChange = useCallback((value: string) => {
    // Only allow valid decimal numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountPay(value);
    }
  }, []);

  const handleOnExchange = async () => {
    setErrorMessage('');

    if (insufficientBalance) {
      setErrorMessage('Insufficient ETH balance');
      return;
    }

    if (!isInputValid()) {
      setErrorMessage('Please enter a valid amount');
      return;
    }

    try {
      await exchangeNfsc(parseEther(amountPay));
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Transaction failed');
    }
  };

  const isInputValid = useCallback(() => {
    try {
      const payValue = Number.parseFloat(amountPay) || 0;
      return payValue > 0 && !Number.isNaN(payValue);
    } catch {
      return false;
    }
  }, [amountPay]);

  const displayReceiveAmount = useCallback(() => {
    if (amountReceive === '') return '';
    try {
      return Number.parseFloat(amountReceive).toFixed(DISPLAY_DECIMALS);
    } catch {
      return '';
    }
  }, [amountReceive]);

  if (isLoading || isConversionRateLoading) {
    return null;
  }

  const isButtonDisabled = insufficientBalance || isPending || !isInputValid();
  const formattedRate = conversionRate
    ? Number.parseFloat(conversionRate).toFixed(DISPLAY_DECIMALS)
    : '0';
  const formattedNfscBalance = nfscBalance
    ? Number.parseFloat(nfscBalance.formatted).toFixed(DISPLAY_DECIMALS)
    : '0';
  const formattedEthBalance = nativeBalance
    ? Number.parseFloat(nativeBalance.formatted).toFixed(DISPLAY_DECIMALS)
    : '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-zinc-950 border border-zinc-800">
        <DialogHeader className="p-6 pb-4">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold">
              Add funds to your NFSC
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="relative mx-6">
            <div className="bg-zinc-900 rounded-lg p-4 mb-1">
              <p className="text-gray-400 mb-2">You pay (excluding gas fee)</p>
              <div className="flex justify-between items-center">
                <Input
                  type="text"
                  placeholder={'0'}
                  value={amountPay}
                  onChange={(e) => handlePayChange(e.target.value)}
                  className="shadow-none pl-0 bg-transparent dark:bg-transparent border-0 text-secondary-foreground text-xl dark:text-xl focus-visible:ring-0 w-1/2"
                />
                <div className="flex items-center gap-2 bg-zinc-700 p-2 px-4 rounded-lg">
                  <Image
                    src="/assets/payment/eth.svg"
                    alt="ETH"
                    width={16}
                    height={16}
                    className="text-secondary-foreground"
                  />
                  <span className="font-medium">ETH</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <p
                  className={`text-sm mt-2 ${insufficientBalance ? 'text-red-500' : 'text-gray-400'}`}
                >
                  Balance: {formattedEthBalance} ETH
                  {insufficientBalance && (
                    <span className="ml-2">• Insufficient balance</span>
                  )}
                </p>
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="size-[48px] bg-zinc-950 rounded-full border-2 border-zinc-800 p-2 flex items-center justify-center">
                <ArrowDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-zinc-900 rounded-lg p-4">
              <p className="text-gray-400 mb-2">You receive</p>
              <div className="flex justify-between items-center">
                <Input
                  type="text"
                  placeholder={'0'}
                  readOnly={true}
                  value={displayReceiveAmount()}
                  className="shadow-none pl-0 bg-transparent dark:bg-transparent border-0 text-secondary-foreground text-xl dark:text-xl focus-visible:ring-0 w-1/2"
                />
                <div className="flex items-center bg-zinc-700 gap-2 p-2 px-4 rounded-md">
                  <Image src="/nfsc.svg" alt="Swap" width={24} height={24} />
                  <span className="font-medium">NFSC</span>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Balance: {formattedNfscBalance} NFSC
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="px-6 pt-2">
              <Alert
                variant="destructive"
                className="bg-red-900/50 border-red-800 text-red-300"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="break-words overflow-auto max-h-[200px] text-ellipsis max-w-full">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="px-6 pb-6 pt-2">
            <div className="flex justify-between text-gray-400 mb-4">
              <span>Rate</span>
              <span>1 ETH = {formattedRate} NFSC</span>
            </div>

            <div className="flex justify-between text-gray-400 mb-4">
              <span>Gas Fee</span>
              <span>ETH</span>
            </div>

            <Button
              className="w-full mt-4 items-center bg-brand-primary hover:bg-brand-primary/90 text-secondary-foreground font-medium py-6 rounded-full flex justify-center gap-2"
              onClick={handleOnExchange}
              disabled={isButtonDisabled}
            >
              {isPending && <Loader2 className="h-5 w-5 animate-spin" />}
              {isPending
                ? 'Processing...'
                : insufficientBalance
                  ? 'Insufficient ETH Balance'
                  : isInputValid()
                    ? 'Swap Tokens'
                    : 'Enter an amount'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
