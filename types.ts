import { type IconType } from "react-icons";
import {
  IoHome,
  IoDesktop,
  IoInformationCircle,
  IoCalendar,
  IoChatbubble,
  IoCall,
  IoPeople,
  IoDocumentText,
} from "react-icons/io5";

export interface NavItem {
  label: string;
  path: string;
  icon?: IconType;
  imageIcon?: string;
  external?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: IoHome },
  { label: "APRO Works", path: "/apro-works", icon: IoDesktop },
  { label: "About APRO", path: "/about", icon: IoInformationCircle },
  { label: "Events", path: "/events", icon: IoCalendar },
  { label: "Feedback", path: "/feedback", icon: IoChatbubble },
  { label: "Contact", path: "/contact", icon: IoCall },
  { label: "Membership", path: "/membership", icon: IoPeople },
  { label: "Legal", path: "/legal", icon: IoDocumentText },
];
