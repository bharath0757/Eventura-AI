export const categories = ["wedding", "birthday", "community"] as const;
export const categoryLabels = {wedding:"Wedding",birthday:"Birthday",community:"Community event"};
export const priorityOptions = {
  wedding:["Food quality","Photography","Venue","Decoration","Entertainment","Affordability","Sustainability","Accessibility"],
  birthday:["Food quality","Decoration","Entertainment","Venue","Affordability","Sustainability","Accessibility"],
  community:["Educational value","Volunteer coordination","Venue","Food quality","Affordability","Sustainability","Accessibility"]
} as const;
export const priorityDescriptions: Record<string,string> = {
  "Food quality":"Make the menu a highlight.", Photography:"Capture the moments that matter.",
  Venue:"Find a space that fits your vision.", Decoration:"Bring your theme to life.",
  Entertainment:"Keep everyone engaged.", Affordability:"Focus on practical, flexible choices.",
  Sustainability:"Reduce waste and reuse materials.", Accessibility:"Make participation easier for everyone.",
  "Educational value":"Build a useful, engaging program.", "Volunteer coordination":"Give every helper a clear role."
};
export const limits = {budgetMin:1000,budgetMax:100_000_000,guestsMax:100_000,notesMax:1000,requirementsMax:500,themeMax:160};
