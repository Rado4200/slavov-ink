/** Per-page headings and metadata. Body copy arrives with each page's phase. */
export type PageContent = {
  title: string;
  description: string;
  heading: string;
  intro: string;
};

export const homePage: PageContent = {
  title: "Slavov Ink",
  description: "TODO: home page meta description",
  heading: "Slavov Ink",
  intro: "TODO: home intro line",
};

export const aboutPage: PageContent = {
  title: "About",
  description: "TODO: about page meta description",
  heading: "About",
  intro: "TODO: short artist intro (real bio comes from the artist)",
};

export const portfolioPage: PageContent = {
  title: "Portfolio",
  description: "TODO: portfolio page meta description",
  heading: "Portfolio",
  intro: "TODO: portfolio intro line",
};
