import { type IconType } from "react-icons";
import {
  IoHome,
  IoDesktop,
  IoInformationCircle,
  IoCalendar,
  IoPeople,
  IoDocumentText,
  IoRocket,
  IoPricetags,
} from "react-icons/io5";

export interface NavItem {
  label: string;
  path: string;
  icon?: IconType;
  imageIcon?: string;
  external?: boolean;
  dividerBefore?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: IoHome },
  { label: "APRO Works", path: "/apro-works", icon: IoDesktop },
  { label: "Pricing", path: "/pricing", icon: IoPricetags },
  { label: "About APRO", path: "/about", icon: IoInformationCircle },
  { label: "Events", path: "/events", icon: IoCalendar, dividerBefore: true },
  { label: "Community", path: "/community", icon: IoRocket },
];
