import ffetch from '../../scripts/ffetch.js';

const allentries = await ffetch('/query-index.json').all();
function filterItems(arr, query) {
  return arr.filter((el) => el.category.includes(query));
}

/* eslint-disable prefer-const */

export default function decorate(block) {
  const base = block.firstElementChild;
  const template = base.firstElementChild.innerText;
  const limit = base.lastElementChild.innerText;
  const list = document.createElement('ul');
  list.id = 'list';
  const match = filterItems(allentries, template);
  match.forEach((i) => {
    if (match.indexOf(i) < limit) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = i.path;
      const img = document.createElement('img');
      img.src = i.image;
      if (img) a.append(img);
      const title = document.createElement('h3');
      title.className = 'title';
      title.innerText = i.title;
      a.append(title);
      const description = document.createElement('p');
      description.className = 'description';
      if (i.description) {
        description.innerText = i.description;
      }
      a.append(description);
      const date = document.createElement('span');
      date.innerText = i.pubdate;
      a.append(date);
      li.append(a);
      list.append(li);
    }
  });
  block.textContent = '';
  block.append(list);
}
