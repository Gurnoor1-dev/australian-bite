import {createFileRoute,useNavigate} from "@tanstack/react-router";
import {useEffect} from "react";
export const Route=createFileRoute("/_authenticated/staff")({component:LegacyStaffRedirect});
function LegacyStaffRedirect(){const navigate=useNavigate();useEffect(()=>{void navigate({to:"/store-dashboard",replace:true})},[navigate]);return <main className="site-shell p-10">Opening the new store dashboard…</main>}
