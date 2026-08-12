export type DirectoryMember = {
  id: string;
  delegation: string;
  fullName: string;
  phone?: string;
};

export const directoryMembers: DirectoryMember[] = [
  { id: "mbouda-jeatsa-augustin-1", delegation: "Mbouda", fullName: "JEATSA AUGUSTIN", phone: "677636359" },
  { id: "mbouda-nago-marie-nicole-2", delegation: "Mbouda", fullName: "NAGO MARIE NICOLE", phone: "676680806" },
  { id: "mbouda-feudjio-marie-claire-3", delegation: "Mbouda", fullName: "FEUDJIO MARIE CLAIRE", phone: "670215553" },
  { id: "mbouda-dongmo-marie-madeleine-4", delegation: "Mbouda", fullName: "DONGMO MARIE MADELEINE" },
  { id: "mbouda-kemi-veronique-5", delegation: "Mbouda", fullName: "KEMI VÉRONIQUE", phone: "653926517" },
  { id: "mbouda-zekeng-cecile-6", delegation: "Mbouda", fullName: "ZEKENG CÉCILE", phone: "680685290" },
  { id: "mbouda-maffo-kenkem-lucienne-7", delegation: "Mbouda", fullName: "MAFFO KENKEM LUCIENNE", phone: "675202086" },
  { id: "mbouda-choumele-elizabeth-8", delegation: "Mbouda", fullName: "CHOUMELE ÉLIZABETH" },
  { id: "mbouda-jiogho-guy-9", delegation: "Mbouda", fullName: "JIOGHO GUY", phone: "670074750" },
  { id: "mbouda-jiogho-judith-10", delegation: "Mbouda", fullName: "JIOGHO JUDITH", phone: "653867412" },
];

export function directoryEmail(member: DirectoryMember): string {
  const slug = member.fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");

  return `${slug}.${member.id.split("-").pop()}@codet.cm`;
}