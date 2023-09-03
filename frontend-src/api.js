const PREFIX = "/notes/";
import { saveAs } from 'file-saver';

const req = (url, options = {}) => {
  const { body } = options;
  console.log('body', body);
  return fetch((PREFIX + url).replace(/\/\/$/, ""), {
    ...options,
    body: body ? JSON.stringify(body) : null,
    headers: {
      ...options.headers,
      ...(body
        ? {
            "Content-Type": "application/json",
          }
        : null),
    },
  }).then((res) =>
    res.ok
      ? res.json()
      : res.text().then((message) => {
          throw new Error(message);
        })
  );
};

export const getNotes = async ({ age, search, page } = {}) => {
  let q2 = await req('', {
    method: 'POST',
    body: { age, search, page }
  });
  console.log('getnotes q2', q2);
  return q2;
};

export const createNote = async (title, text) => {
  let q1 = await req('createnote', {
    method: 'POST',
    body: {title, text}
  });
  console.log('createNote q1', q1);
  return q1;
};

export const getNote = async (id) => {
  let q3 = await req('getnote', {
    method: 'POST',
    body: {id}
  });
  console.log('getnote q3', q3);
  return q3;
};

export const archiveNote = async (id) => {
  let q4 = await req('archivenote', {
    method: 'POST',
    body: {id}
  });
  console.log('archivenote q4', q4);
  return q4;
};

export const unarchiveNote = async (id) => {
  let q = await req('arcive/unarchivenote', {
    method: 'POST',
    body: {id}
  });
  console.log('unarchivenote, q', q);
  return q;
};

export const editNote = async (id, title, text) => {
  let q = await req('editnote', {
    method: 'POST',
    body: {id, title, text}
  })
  console.log('editnote q', q);
};

export const deleteNote = async (id) => {
  let q = await req('arcive/deletenote', {
    method: 'POST',
    body: {id}
  });
  console.log('deletenote', q);
};

export const deleteAllArchived = async () => {
  let q = await req('arcive/deleteallarchived', {
    method: 'POST'
  });
  console.log('deleteallarchived', q);
};

export const notePdfUrl = (id) => {
  fetch('/api/createpdf', {
    method: 'POST',
    body: {id},
    responseType: 'arraybuffer'
  })
  .then((res) => res.arrayBuffer())
  .then((res) => {
    console.log(res);
    const pdfBlob = new Blob([res], { type: 'application/pdf' });
    saveAs(pdfBlob, 'newPdf.pdf');
  })
};
