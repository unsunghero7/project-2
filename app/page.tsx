import { MapPin, Package, ShoppingBag } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Component() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="flex-1 p-4 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-lg">
              <Image
                alt="Restaurant logo"
                className="aspect-square object-cover"
                height="64"
                src="/placeholder.svg"
                width="64"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Mat Salleh</h1>
              <p className="text-sm text-muted-foreground">
                Select your order type and branch
              </p>
              <div className="mt-4">
                <RadioGroup defaultValue="delivery" className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup">Pickup</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery">Delivery</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="mt-4">
                <Label>Delivery Address</Label>
                <div className="mt-1.5 flex gap-2">
                  <Select>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Mat Salleh Taman..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="branch1">
                        Mat Salleh Taman Branch
                      </SelectItem>
                      <SelectItem value="branch2">
                        Mat Salleh City Branch
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="gap-2">
                    <MapPin className="h-4 w-4" />
                    Add Address
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <ScrollArea className="mt-8">
            <div className="grid gap-8">
              <section>
                <h2 className="text-xl font-bold">Air</h2>
                <div className="mt-4 grid gap-4">
                  <MenuItem name="Hot Chocolate" price="$8.00" />
                  <MenuItem name="Sirap Bandung" price="$6.00" />
                  <MenuItem name="Limonade" price="$6.00" />
                </div>
              </section>
              <section>
                <h2 className="text-xl font-bold">Dessert</h2>
                <div className="mt-4 grid gap-4">
                  <MenuItem name="Apple Pie" price="$12.00" />
                </div>
              </section>
              <section>
                <h2 className="text-xl font-bold">Nasi Lemak</h2>
                <div className="mt-4 grid gap-4">
                  <MenuItem
                    name="Set C - Rendang Chicken + Sambal Udang"
                    price="$15.00"
                    imageSrc="/placeholder.svg"
                  />
                  <MenuItem
                    name="Set B - Sambal Ikan Bilis + Rendang Chicken"
                    price="$12.00"
                    imageSrc="/placeholder.svg"
                  />
                  <MenuItem
                    name="Set A - Sambal Ikan Bilis"
                    price="$10.00"
                    imageSrc="/placeholder.svg"
                  />
                  <MenuItem name="Nasi D" price="$12.00" />
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
      <div className="w-full border-t lg:w-[400px] lg:border-l lg:border-t-0">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Your Order
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                0 items
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex gap-2">
                <Input placeholder="Discount Code" />
                <Button className="shrink-0">Apply</Button>
              </div>
              <Separator />
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-sm">Subtotal</span>
                  <span className="text-sm">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Platform Fee</span>
                  <span className="text-sm">$1.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Payment Processing</span>
                  <span className="text-sm">$1.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Delivery Fee</span>
                  <span className="text-sm">Calculating...</span>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>$2.00</span>
              </div>
              <Button className="w-full" size="lg">
                Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Button
        className="fixed bottom-4 right-4 gap-2"
        size="lg"
        variant="outline"
      >
        <Package className="h-4 w-4" />
        Install App
      </Button>
    </div>
  );
}

function MenuItem({
  name,
  price,
  imageSrc,
}: {
  name: string;
  price: string;
  imageSrc?: string;
}) {
  return (
    <div className="flex items-center gap-4">
      {imageSrc && (
        <div className="h-16 w-16 overflow-hidden rounded-lg">
          <Image
            alt={name}
            className="aspect-square object-cover"
            height="64"
            src={imageSrc}
            width="64"
          />
        </div>
      )}
      <div className="flex flex-1 items-center justify-between">
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{price}</p>
        </div>
        <Button variant="ghost" size="icon">
          +
        </Button>
      </div>
    </div>
  );
}
