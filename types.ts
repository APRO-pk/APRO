import { type IconType } from "react-icons";
import {
  IoHomeOutline,
  IoDesktopOutline,
  IoInformationCircleOutline,
  IoCalendarOutline,
  IoChatbubbleOutline,
  IoCallOutline,
  IoPeopleOutline,
  IoDocumentTextOutline,
} from "react-icons/io5";

export interface NavItem {
  label: string;
  path: string;
  icon: IconType;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", path: "/", icon: IoHomeOutline },
  { label: "APRO Works", path: "/apro-works", icon: IoDesktopOutline },
  { label: "About APRO", path: "/about", icon: IoInformationCircleOutline },
  { label: "Events", path: "/events", icon: IoCalendarOutline },
  { label: "Feedback", path: "/feedback", icon: IoChatbubbleOutline },
  { label: "Contact", path: "/contact", icon: IoCallOutline },
  { label: "Membership", path: "/membership", icon: IoPeopleOutline },
  { label: "Legal", path: "/legal", icon: IoDocumentTextOutline },
];
