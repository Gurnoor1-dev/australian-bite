import {useEffect,useState} from "react";
import type {Session,User} from "@supabase/supabase-js";
import {supabase} from "@/integrations/supabase/client";
export function useAuth(){
 const [session,setSession]=useState<Session|null>(null),[loading,setLoading]=useState(true),[isStaff,setIsStaff]=useState(false),[isAdmin,setIsAdmin]=useState(false);
 useEffect(()=>{const {data:sub}=supabase.auth.onAuthStateChange((_event,next)=>setSession(next));supabase.auth.getSession().then(({data})=>{setSession(data.session);setLoading(false)});return()=>sub.subscription.unsubscribe()},[]);
 useEffect(()=>{let active=true;const uid=session?.user?.id;if(!uid){setIsStaff(false);setIsAdmin(false);return}supabase.from("user_roles").select("role").eq("user_id",uid).then(({data})=>{if(active){setIsStaff((data??[]).some((r:any)=>["admin","store"].includes(r.role)));setIsAdmin((data??[]).some((r:any)=>r.role==="admin"))}});return()=>{active=false}},[session?.user?.id]);
 const user:User|null=session?.user??null;return {session,user,loading,isStaff,isAdmin};
}
