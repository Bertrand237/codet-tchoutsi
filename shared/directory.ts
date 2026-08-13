import directoryDocument from "../attached_assets/Pasted-Voici-le-document-complet-restructur-sous-une-fiche-sta_1786579234916.txt?raw";

export type DirectoryMember = {
  id: string;
  number: number;
  delegation: string;
  fullName: string;
  phone?: string;
};

function parseDirectoryDocument(document: string): DirectoryMember[] {
  return document
    .split(/\r?\n/)
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
    .filter((cells) => cells.length >= 5)
    .map((cells) => {
      const number = Number(cells[0]);
      const phone = cells[4] && cells[4] !== "-" ? cells[4] : undefined;

      return {
        id: `directory-${number}`,
        number,
        delegation: cells[1],
        fullName: cells[2],
        ...(phone && { phone }),
      };
    });
}

export const directoryMembers = parseDirectoryDocument(directoryDocument);

export function directoryEmail(member: DirectoryMember): string {
  const slug = member.fullName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".");

  return `${slug}.${member.id.split("-").pop()}@codet.cm`;
}