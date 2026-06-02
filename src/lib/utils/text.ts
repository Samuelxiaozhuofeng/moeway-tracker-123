export function splitListText(value?: string) {
  return value?.split(/\n|,|，/).map((item) => item.trim()).filter(Boolean) ?? [];
}
