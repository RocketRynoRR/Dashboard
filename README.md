# Team Links Dashboard

A simple static dashboard for useful business and team links. It is designed for GitHub Pages, so it does not need a server or build step.

## Edit Links

Open `dashboard.js` and update the `links` array:

```js
{
  title: "Client Portal",
  url: "https://example.com",
  category: "Clients",
  note: "Bookings, notes, and customer details.",
  icon: "C",
  color: "#146c63"
}
```

## Host On GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, `dashboard.js`, and `README.md`.
3. In GitHub, open **Settings > Pages**.
4. Set **Source** to **Deploy from a branch**.
5. Choose your main branch and the root folder.

Your dashboard will publish as a GitHub Pages website.
