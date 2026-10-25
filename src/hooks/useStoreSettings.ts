import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
export type StoreSettings={store_name:string;phone:string;address:string;opening_hours:string;currency_code:string;festival_pricing_note:string;delivery_fee:number;is_accepting_orders:boolean};
export function useStoreSettings(){return useQuery({queryKey:["store-settings"],staleTime:60000,queryFn:async()=>{const {data,error}=await supabase.from("store_settings").select("store_name,phone,address,opening_hours,currency_code,festival_pricing_note,delivery_fee,is_accepting_orders").eq("id",1).single();if(error)throw error;return data as StoreSettings}})}
