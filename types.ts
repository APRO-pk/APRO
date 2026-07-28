import { type IconType } from "react-icons";
import {
  IoHome,
  IoDesktop,
  IoInformationCircle,
  IoCalendar,
  IoPeople,
  IoDocumentText,
  IoRocket,
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
  { label: "Community", path: "/community", icon: IoRocket },
  { label: "Membership", path: "/membership", icon: IoPeople },
  { label: "Legal", path: "/legal", icon: IoDocumentText },
];
