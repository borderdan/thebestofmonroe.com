"use client";

import { useCartStore } from "@/stores/use-cart-store";
import {
  processCashCheckout,
  createMercadoPagoIntent,
  createCodiIntent,
  processGiftCardCheckout,
  createGiftCard,
} from "@/app/[locale]/app/pos/actions";
import { sendWhatsAppMessage } from "@/lib/services/whatsapp";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { Loader2, Trash2, Smartphone, Banknote, QrCode, Gift, Ticket, RefreshCw, Coins, UserPlus, CheckCircle2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

interface CartSidebarProps {
  customers: {
    id: string;
    first_name: string;
    last_name: string;
    phone?: string;
    loyalty_points: number;
  }[]
  currencySettings: {
    currencies: {
      currency_code: string;
      is_default?: boolean;
      business_id?: string;
    }[]
    rates: {
      from_currency: string;
      to_currency: string;
      rate: number;
    }[]
  }
}

export function CartSidebar({ customers, currencySettings }: CartSidebarProps) {
  const t = useTranslations("pos");
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const taxRate = useCartStore((s) => s.taxRate);
  const selectedCurrency = useCartStore((s) => s.currentCurrency);
  const setSelectedCurrency = useCartStore((s) => s.setCurrentCurrency);

  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const tax = subtotal * (taxRate || 0.16);
  const total = subtotal + tax;

  const [loading, setLoading] = useState(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ txId: string, token: string } | null>(null);
  const [whatsappPhone, setWhatsAppPhone] = useState("");

  // Loyalty & Gift Card State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | "guest">("guest");
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [giftCardCode, setGiftCardCode] = useState("");
  const [showGCInput, setShowGCInput] = useState(false);

  // Currency State initialized via Zustand defaults to MXN
  // Find current rate relative to selectedCurrency (all DB prices in MXN)
  const currentRate = currencySettings.rates.find(r => r.from_currency === selectedCurrency && r.to_currency === 'MXN')?.rate || 1.0;
  
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  
  // Hardcoded ratios for UI feedback (ideally fetch from business config)
  const REDEMPTION_RATIO = 0.05; 
  const loyaltyDiscountBase = pointsToRedeem * REDEMPTION_RATIO;
  
  // Amounts in selected currency
  const totalInSelected = Math.round((total / currentRate) * 100) / 100;
  const discountInSelected = Math.round((loyaltyDiscountBase / currentRate) * 100) / 100;
  const finalTotalInSelected = Math.max(0, totalInSelected - discountInSelected);

  const supabase = createClient();

  // Realtime subscription for pending digital payments
  useEffect(() => {
    if (!activeTxId) return;

    const channel = supabase
      .channel(`tx_${activeTxId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transactions",
          filter: `id=eq.${activeTxId}`,
        },
        (payload) => {
          if (payload.new.payment_status === "completed") {
            setModalOpen(false);
            setActiveTxId(null);
            setSuccessData({ txId: payload.new.id, token: payload.new.receipt_token });
            setWhatsAppPhone(selectedCustomer?.phone || "");
            toast.success("Payment Successful");
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTxId, supabase, selectedCustomer?.phone]);

  const mapCartForAction = () =>
    items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
    }));

  const handleCash = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const res = await processCashCheckout({
      amount: finalTotalInSelected,
      currency: selectedCurrency,
      exchangeRate: currentRate,
      cart: mapCartForAction(),
      customerId: selectedCustomerId === "guest" ? undefined : selectedCustomerId,
      pointsToRedeem: pointsToRedeem,
      paymentMethod: "cash"
    }) as { success: boolean, transactionId?: string, receiptToken?: string, error?: string };
    if (res.success && res.transactionId && res.receiptToken) {
      setSuccessData({ txId: res.transactionId, token: res.receiptToken });
      setWhatsAppPhone(selectedCustomer?.phone || "");
      toast.success("Cash payment completed");
    } else {
      toast.error(res.error || "Failed to process payment");
    }
    setLoading(false);
  };

  const handleMP = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const res = await createMercadoPagoIntent(
      { 
        amount: finalTotalInSelected, 
        currency: selectedCurrency,
        exchangeRate: currentRate,
        cart: mapCartForAction(),
        customerId: selectedCustomerId === "guest" ? undefined : selectedCustomerId,
        pointsToRedeem: pointsToRedeem,
        paymentMethod: "mercadopago"
      },
      "terminal_123",
    );
    if (res.success && 'transactionId' in res) {
      setActiveTxId(res.transactionId || null);
      setQrData(null);
      setModalOpen(true);
    } else {
      toast.error((res as { error?: string }).error || "Failed to start MP payment");
    }
    setLoading(false);
  };

  const handleCodi = async () => {
    if (items.length === 0) return;
    setLoading(true);
    const res = await createCodiIntent({
      amount: finalTotalInSelected,
      currency: selectedCurrency,
      exchangeRate: currentRate,
      cart: mapCartForAction(),
      customerId: selectedCustomerId === "guest" ? undefined : selectedCustomerId,
      pointsToRedeem: pointsToRedeem,
      paymentMethod: "codi"
    }) as { success: boolean, transactionId?: string, qrPayload?: string, error?: string };
    if (res.success && res.transactionId && res.qrPayload) {
      setActiveTxId(res.transactionId);
      setQrData(res.qrPayload || null);
      setModalOpen(true);
    } else {

      toast.error((res as { error?: string }).error || "Failed to start CoDi payment");
    }
    setLoading(false);
  };

  const handleGiftCard = async () => {
    if (items.length === 0 || !giftCardCode) return;
    setLoading(true);
    const res = await processGiftCardCheckout({
      amount: finalTotalInSelected,
      currency: selectedCurrency,
      exchangeRate: currentRate,
      cart: mapCartForAction(),
      customerId: selectedCustomerId === "guest" ? undefined : selectedCustomerId,
      pointsToRedeem: pointsToRedeem,
      giftCardCode: giftCardCode,
      paymentMethod: "gift_card"
    }) as { success: boolean, transactionId?: string, receiptToken?: string, error?: string };
    if (res.success && res.transactionId && res.receiptToken) {
      setSuccessData({ txId: res.transactionId, token: res.receiptToken });
      setWhatsAppPhone(selectedCustomer?.phone || "");
      setGiftCardCode("");
      setShowGCInput(false);
      toast.success("Gift card payment processed");
    } else {
      toast.error(res.error || "Failed to process gift card");
    }
    setLoading(false);
  };

  const handleSendWhatsApp = async () => {
    if (!successData || !whatsappPhone) return;
    setLoading(true);
    const res = await sendWhatsAppMessage({
      to: whatsappPhone,
      type: 'receipt',
      transactionId: successData.txId,
      businessId: currencySettings.currencies[0]?.business_id || "",
      customerId: selectedCustomerId === "guest" ? undefined : selectedCustomerId,
      metadata: { receipt_token: successData.token }
    });
    if (res.success) {
      toast.success("WhatsApp receipt sent!");
      closeSuccess();
    } else {
      toast.error(res.error);
    }
    setLoading(false);
  };

  const handleCreateGiftCard = async () => {
    const amount = prompt("Enter Gift Card Amount:");
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setLoading(true);
    const res = await createGiftCard(parseFloat(amount), selectedCustomerId === "guest" ? undefined : selectedCustomerId);
    if (res.success) {
      toast.success(`Gift Card Created! Code: ${res.code}`, { duration: 10000 });
    } else {
      toast.error("Failed to create gift card");
    }
    setLoading(false);
  };

  const closeSuccess = () => {
    setSuccessData(null);
    clearCart();
    setPointsToRedeem(0);
    setSelectedCustomerId("guest");
  };

  return (
    <div
      className="flex flex-col h-full bg-card border-l"
      data-testid="cart-sidebar"
    >
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t("currentOrder")}</h2>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t("clearCart")}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Currency & Customer Selectors */}
        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-dashed">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Currency
            </Label>
            {selectedCurrency !== 'MXN' && (
              <span className="text-[10px] text-muted-foreground font-mono">
                1 {selectedCurrency} = {currentRate.toFixed(2)} MXN
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={selectedCurrency} onValueChange={(val) => val && setSelectedCurrency(val)}>
              <SelectTrigger className="bg-card h-9 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencySettings.currencies.map(c => (
                  <SelectItem key={c.currency_code} value={c.currency_code}>
                    {c.currency_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={selectedCustomerId} 
              onValueChange={(val) => {
                if (val === "guest" || val === "undefined" || !val) {
                  setSelectedCustomerId("guest");
                } else {
                  setSelectedCustomerId(val);
                }
              }}
            >
              <SelectTrigger className="bg-card h-9 text-sm flex-1">
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">Guest Checkout</SelectItem>
                {customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCustomer && (
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                {selectedCustomer.loyalty_points || 0} pts
              </Badge>
              {selectedCustomer.loyalty_points > 0 && (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Redeem..."
                    className="h-7 text-[10px] w-20 bg-card"
                    value={pointsToRedeem || ''}
                    onChange={(e) => setPointsToRedeem(Math.min(selectedCustomer.loyalty_points, parseInt(e.target.value) || 0))}
                  />
                  <span className="text-[9px] text-muted-foreground">
                    ≈ {discountInSelected.toFixed(2)} {selectedCurrency}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-2">
              <span className="text-2xl">🛒</span>
            </div>
            <p className="font-medium">{t("cartEmpty")}</p>
            <p className="text-sm">{t("cartEmptySub")}</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-start group"
              data-testid="cart-item"
            >
              <div className="flex-1">
                <h4 className="font-medium line-clamp-2 text-sm">
                  {item.name}
                </h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-semibold">
                    ${item.price.toFixed(2)}
                  </span>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm hover:bg-card shadow-sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="text-sm w-6 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-sm hover:bg-card shadow-sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <span className="font-bold block">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50 border-t space-y-4">
        {/* Quick Utilities */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-[10px] h-8 font-bold uppercase tracking-wider"
            onClick={handleCreateGiftCard}
            disabled={loading}
          >
            <Ticket className="w-3 h-3 mr-1" />
            Sell Gift Card
          </Button>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t("subtotal")}</span>
            <span>{(subtotal / currentRate).toFixed(2)} {selectedCurrency}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t("tax")}</span>
            <span>{(tax / currentRate).toFixed(2)} {selectedCurrency}</span>
          </div>
          {discountInSelected > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 font-medium">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3" />
                Loyalty Discount
              </span>
              <span>-{discountInSelected.toFixed(2)} {selectedCurrency}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between text-2xl font-bold">
            <span>{t("total")}</span>
            <div className="flex flex-col items-end">
              <span data-testid="cart-total-value">
                {finalTotalInSelected.toFixed(2)} {selectedCurrency}
              </span>
              {selectedCurrency !== 'MXN' && (
                <span className="text-[10px] text-muted-foreground font-normal">
                  ≈ {(total - loyaltyDiscountBase).toFixed(2)} MXN
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          <Button
            className="w-full text-lg h-14 bg-emerald-600 hover:bg-emerald-700"
            size="lg"
            disabled={items.length === 0 || loading}
            onClick={handleCash}
            data-testid="checkout-cash-btn"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Banknote className="w-5 h-5 mr-2" />
            )}
            {t("payWithCash")}
          </Button>
          {showGCInput ? (
            <div className="flex gap-2 animate-in slide-in-from-right-2">
              <Input 
                placeholder="Enter GC Code..." 
                value={giftCardCode} 
                onChange={e => setGiftCardCode(e.target.value.toUpperCase())}
                className="bg-card"
              />
              <Button onClick={handleGiftCard} disabled={loading || !giftCardCode}>Apply</Button>
              <Button variant="ghost" onClick={() => setShowGCInput(false)}>X</Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="w-full h-12 text-blue-600 border-blue-200 hover:bg-blue-50"
                disabled={items.length === 0 || loading}
                onClick={handleMP}
                data-testid="checkout-terminal-btn"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Terminal
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-purple-600 border-purple-200 hover:bg-purple-50"
                disabled={items.length === 0 || loading}
                onClick={handleCodi}
                data-testid="checkout-codi-btn"
              >
                <QrCode className="w-4 h-4 mr-2" />
                CoDi
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-orange-600 border-orange-200 hover:bg-orange-50"
                disabled={items.length === 0 || loading}
                onClick={() => setShowGCInput(true)}
              >
                <Gift className="w-4 h-4 mr-2" />
                Gift
              </Button>
            </div>
          )}
        </div>

        {/* Async Payment Modal */}
        <Dialog
          open={modalOpen || !!successData}
          onOpenChange={(open) => {
            if (!open) {
              setModalOpen(false);
              setActiveTxId(null);
              if (successData) closeSuccess();
            }
          }}
        >
          <DialogContent className="sm:max-w-md text-center flex flex-col items-center justify-center p-8">
            {successData ? (
              <div className="space-y-6 w-full">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-2xl text-center">Payment Successful!</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs text-left text-muted-foreground">Send Receipt to WhatsApp</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Phone (e.g. 521...)" 
                        value={whatsappPhone}
                        onChange={e => setWhatsAppPhone(e.target.value)}
                        className="font-mono"
                      />
                      <Button onClick={handleSendWhatsApp} disabled={loading || !whatsappPhone} className="bg-[#25D366] hover:bg-[#128C7E]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                        Send
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button variant="outline" className="w-full" onClick={closeSuccess}>
                    Done / Next Sale
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">
                    {qrData ? "Scan CoDi QR" : "Waiting for Terminal"}
                  </DialogTitle>
                </DialogHeader>

                {qrData ? (
                  <div className="p-4 bg-card rounded-xl mt-4 border shadow-sm">
                    <QRCodeSVG value={qrData} size={256} className="mx-auto" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      Scan with bank app
                    </p>
                  </div>
                ) : (
                  <div className="mt-8 mb-4 animate-pulse">
                    <Smartphone className="w-24 h-24 mx-auto text-blue-500 mb-6" />
                    <span className="text-lg text-muted-foreground">
                      Please ask the customer to complete payment on the card
                      reader.
                    </span>
                  </div>
                )}

                <DialogFooter className="mt-6 w-full sm:justify-center">
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>
                    Cancel Payment
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
