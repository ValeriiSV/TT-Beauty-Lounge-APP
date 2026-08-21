(() => {
  'use strict';

  const PAGE_WIDTH = 1240;
  const PAGE_HEIGHT = 1754;
  const PDF_WIDTH = 595.28;
  const PDF_HEIGHT = 841.89;
  const encoder = new TextEncoder();

  const bytes = value => encoder.encode(value);

  function joinBytes(parts) {
    const length = parts.reduce((sum, part) => sum + part.length, 0);
    const result = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      result.set(part, offset);
      offset += part.length;
    }
    return result;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth, maxLines = 2) {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    if (!words.length) return ['—'];
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth || !line) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
        if (lines.length === maxLines - 1) break;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
      while (lines[maxLines - 1].length > 1 && ctx.measureText(`${lines[maxLines - 1]}…`).width > maxWidth) {
        lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1);
      }
      lines[maxLines - 1] += '…';
    }
    return lines;
  }

  function drawValue(ctx, label, value, x, y, maxWidth, maxLines = 1) {
    ctx.fillStyle = '#7b6b61';
    ctx.font = '600 23px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${label}:`, x, y);
    const labelWidth = ctx.measureText(`${label}: `).width;
    ctx.fillStyle = '#211915';
    ctx.font = '500 23px system-ui, -apple-system, sans-serif';
    const lines = wrapText(ctx, value || 'Nespecificat', maxWidth - labelWidth, maxLines);
    ctx.fillText(lines[0], x + labelWidth, y);
    for (let index = 1; index < lines.length; index += 1) {
      ctx.fillText(lines[index], x, y + index * 29);
    }
    return y + Math.max(1, lines.length) * 29;
  }

  async function loadPhoto(url) {
    if (!url) return null;
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const blob = await response.blob();
      if ('createImageBitmap' in window) return await createImageBitmap(blob);
      const objectUrl = URL.createObjectURL(blob);
      try {
        return await new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = objectUrl;
        });
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return null;
    }
  }

  function drawPhoto(ctx, image, x, y, width, height) {
    roundedRect(ctx, x, y, width, height, 22);
    ctx.save();
    ctx.clip();
    if (!image) {
      ctx.fillStyle = '#eee7df';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#9a887c';
      ctx.font = '600 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Fără fotografie', x + width / 2, y + height / 2);
      ctx.textAlign = 'left';
    } else {
      const imageWidth = image.width || image.naturalWidth;
      const imageHeight = image.height || image.naturalHeight;
      const scale = Math.max(width / imageWidth, height / imageHeight);
      const sourceWidth = width / scale;
      const sourceHeight = height / scale;
      const sourceX = (imageWidth - sourceWidth) / 2;
      const sourceY = (imageHeight - sourceHeight) / 2;
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
    }
    ctx.restore();
  }

  function statusLabel(status) {
    if (status === 'approved') return 'CONFIRMATĂ';
    if (status === 'pending') return 'ÎN AȘTEPTARE';
    return String(status || '').toUpperCase();
  }

  function formatPrice(value) {
    const price = Number(value);
    return Number.isFinite(price) && price > 0 ? `${price.toFixed(0)} MDL` : 'Nestabilit';
  }

  function canvasToJpeg(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(async blob => {
        if (!blob) {
          reject(new Error('PDF-ul nu a putut fi generat.'));
          return;
        }
        resolve(new Uint8Array(await blob.arrayBuffer()));
      }, 'image/jpeg', 0.88);
    });
  }

  async function renderPages(date, appointments) {
    const photos = await Promise.all(appointments.map(item => loadPhoto(item.hair_photo_url)));
    const pages = [];
    const perPage = 3;
    const totalPages = Math.ceil(appointments.length / perPage);
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('ro-RO', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
      const canvas = document.createElement('canvas');
      canvas.width = PAGE_WIDTH;
      canvas.height = PAGE_HEIGHT;
      const ctx = canvas.getContext('2d', { alpha: false });
      ctx.fillStyle = '#fbf8f3';
      ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
      ctx.fillStyle = '#211915';
      ctx.fillRect(0, 0, PAGE_WIDTH, 190);
      ctx.strokeStyle = '#c9a05e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(92, 95, 47, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#d4ad69';
      ctx.font = '700 43px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('TT', 92, 109);
      ctx.textAlign = 'left';
      ctx.font = '700 38px Georgia, serif';
      ctx.fillText('Programările zilei', 165, 78);
      ctx.fillStyle = '#e8d9c8';
      ctx.font = '500 25px system-ui, -apple-system, sans-serif';
      ctx.fillText(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), 165, 123);
      ctx.fillStyle = '#d4ad69';
      ctx.font = '700 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${appointments.length} programări`, 165, 158);

      const start = pageIndex * perPage;
      const rows = appointments.slice(start, start + perPage);
      rows.forEach((item, rowIndex) => {
        const globalIndex = start + rowIndex;
        const x = 65;
        const y = 225 + rowIndex * 455;
        const width = 1110;
        const height = 420;
        roundedRect(ctx, x, y, width, height, 28);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#ded2c7';
        ctx.lineWidth = 2;
        ctx.stroke();

        roundedRect(ctx, x + 30, y + 28, 118, 54, 27);
        ctx.fillStyle = '#211915';
        ctx.fill();
        ctx.fillStyle = '#d4ad69';
        ctx.font = '800 29px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(item.preferred_time || '').slice(0, 5), x + 89, y + 65);
        ctx.textAlign = 'left';

        ctx.fillStyle = item.status === 'approved' ? '#2f7650' : '#9b6b24';
        ctx.font = '800 19px system-ui, -apple-system, sans-serif';
        ctx.fillText(statusLabel(item.status), x + 172, y + 64);
        ctx.fillStyle = '#211915';
        ctx.font = '700 32px Georgia, serif';
        ctx.fillText(wrapText(ctx, item.name, 565, 1)[0], x + 30, y + 122);

        let lineY = y + 165;
        lineY = drawValue(ctx, 'Procedură', item.service, x + 30, lineY, 690, 2);
        lineY = drawValue(ctx, 'Durată', `${item.duration_minutes || 60} minute`, x + 30, lineY, 690);
        lineY = drawValue(ctx, 'Telefon', item.phone, x + 30, lineY, 690);
        lineY = drawValue(ctx, 'Email', item.client_email || 'Nespecificat', x + 30, lineY, 690, 1);
        lineY = drawValue(ctx, 'Lungimea părului', item.hair_length || 'Nespecificată', x + 30, lineY, 690);
        lineY = drawValue(ctx, 'Preț estimat', formatPrice(item.quoted_price), x + 30, lineY, 690);
        if (item.note) drawValue(ctx, 'Observații', item.note, x + 30, lineY, 690, 2);

        drawPhoto(ctx, photos[globalIndex], x + 760, y + 70, 315, 295);
      });

      ctx.fillStyle = '#87776d';
      ctx.font = '500 18px system-ui, -apple-system, sans-serif';
      ctx.fillText(`TT Beauty Lounge · generat ${new Date().toLocaleString('ro-RO')}`, 65, 1710);
      ctx.textAlign = 'right';
      ctx.fillText(`Pagina ${pageIndex + 1} din ${totalPages}`, 1175, 1710);
      ctx.textAlign = 'left';
      pages.push(await canvasToJpeg(canvas));
    }

    photos.forEach(photo => photo?.close?.());
    return pages;
  }

  function buildPdf(pageImages) {
    const count = pageImages.length;
    const totalObjects = 2 + count * 3;
    const pageIds = Array.from({ length: count }, (_, index) => 3 + index * 3);
    const objects = new Map();
    objects.set(1, [bytes('<< /Type /Catalog /Pages 2 0 R >>')]);
    objects.set(2, [bytes(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${count} >>`)]);

    pageImages.forEach((image, index) => {
      const pageId = 3 + index * 3;
      const imageId = pageId + 1;
      const contentId = pageId + 2;
      const content = bytes(`q\n${PDF_WIDTH} 0 0 ${PDF_HEIGHT} 0 0 cm\n/Im0 Do\nQ\n`);
      objects.set(pageId, [bytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_WIDTH} ${PDF_HEIGHT}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)]);
      objects.set(imageId, [
        bytes(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),
        image,
        bytes('\nendstream')
      ]);
      objects.set(contentId, [bytes(`<< /Length ${content.length} >>\nstream\n`), content, bytes('endstream')]);
    });

    const parts = [bytes('%PDF-1.4\n%TTBL\n')];
    const offsets = new Array(totalObjects + 1).fill(0);
    let length = parts[0].length;
    for (let id = 1; id <= totalObjects; id += 1) {
      offsets[id] = length;
      const objectParts = [bytes(`${id} 0 obj\n`), ...objects.get(id), bytes('\nendobj\n')];
      parts.push(...objectParts);
      length += objectParts.reduce((sum, part) => sum + part.length, 0);
    }
    const xrefOffset = length;
    let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
    for (let id = 1; id <= totalObjects; id += 1) xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    xref += `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    parts.push(bytes(xref));
    return new Blob([joinBytes(parts)], { type: 'application/pdf' });
  }

  async function savePdf(blob, filename) {
    const file = new File([blob], filename, { type: 'application/pdf' });

    // iPhone / iPad / telefoane compatibile:
    // deschide meniul Share -> Save to Files
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: 'Programări TT Beauty Lounge',
          files: [file]
        });
        return;
      } catch (error) {
        // Dacă utilizatorul închide Share, nu afișăm eroare.
        if (error?.name === 'AbortError') return;
      }
    }

    // Mac / Windows / browsere desktop
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 5000);
  }

  async function downloadDailyAppointments(date, appointments) {
    if (!date) throw new Error('Alege o zi din calendar.');
    if (!appointments.length) throw new Error('Nu există programări pentru ziua selectată.');
    const pageImages = await renderPages(date, appointments);
    const pdf = buildPdf(pageImages);
    await savePdf(pdf, `programari-TT-Beauty-${date}.pdf`);
  }

  window.TTPdf = { downloadDailyAppointments };
})();
