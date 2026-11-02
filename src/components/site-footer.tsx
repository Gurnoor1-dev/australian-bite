import {Link} from "@tanstack/react-router";
import {Clock3,MapPin,Phone} from "lucide-react";
import {useStoreSettings} from "@/hooks/useStoreSettings";
import logo from "@/assets/australian-bite-logo.png";
import {STORE_ADDRESS,STORE_HOURS,SUPPORT_PHONE} from "@/lib/format";
export function SiteFooter(){const {data:store}=useStoreSettings(),phone=store?.phone||SUPPORT_PHONE,address=store?.address||STORE_ADDRESS,hours=store?.opening_hours||STORE_HOURS;return <footer className="ab-footer"><div className="ab-footer-main"><div><Link to="/"><img src={logo} alt="Australian Bite" width="170"/></Link><p>Good food, made for everyday moments in Pehowa.</p></div><div><b>Visit us</b><p><MapPin/> {address}</p><p><Clock3/> {hours}</p><p><Phone/> <a href={"tel:"+phone.replace(/[^+0-9]/g,"")}>{phone}</a></p></div><div><b>Order online</b><Link to="/menu">Explore the menu</Link><Link to="/orders">Track an order</Link><Link to="/support">Contact the restaurant</Link></div></div><div className="ab-footer-bottom"><span>© {new Date().getFullYear()} Australian Bite</span><span>Pehowa, Haryana · India</span></div></footer>}
