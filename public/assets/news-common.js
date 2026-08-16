function noaaSortNews(items) {
  var withOrder = items.filter(function(i){ return i.order !== null && i.order !== undefined && i.order !== ""; });
  var withoutOrder = items.filter(function(i){ return i.order === null || i.order === undefined || i.order === ""; });
  withOrder.sort(function(a, b){ return Number(a.order) - Number(b.order); });
  withoutOrder.sort(function(a, b){ return new Date(b.date) - new Date(a.date); });
  return withOrder.concat(withoutOrder);
}

function noaaPublishedNews(items) {
  return items.filter(function(i){ return i.status !== "hidden"; });
}

function noaaNewsLink(item) {
  if (item.link) return item.link;
  return "/news/post/?id=" + encodeURIComponent(item.id);
}

function noaaFormatDate(d) {
  if (!d) return "";
  return d.replace(/-/g, ".");
}
