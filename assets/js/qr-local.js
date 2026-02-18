/**
 * Local QR Code Generator — No external services, secret stays in browser
 * Generates QR codes on a <canvas> element using only browser APIs.
 * Supports Byte mode, EC Level L, Versions 1-20 (up to ~650 bytes).
 * Used for 2FA TOTP setup — replaces api.qrserver.com.
 */
(function(window) {
    'use strict';

    // GF(256) arithmetic for Reed-Solomon
    const GF_EXP = new Uint8Array(512);
    const GF_LOG = new Uint8Array(256);
    (function initGF() {
        let x = 1;
        for (let i = 0; i < 255; i++) {
            GF_EXP[i] = x;
            GF_LOG[x] = i;
            x = (x << 1) ^ (x >= 128 ? 0x11D : 0);
        }
        for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
    })();

    function gfMul(a, b) { return a === 0 || b === 0 ? 0 : GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255]; }

    function rsEncode(data, ecLen) {
        const gen = new Uint8Array(ecLen + 1);
        gen[0] = 1;
        for (let i = 0; i < ecLen; i++) {
            for (let j = ecLen; j >= 1; j--) {
                gen[j] = gen[j] ^ gfMul(gen[j - 1], GF_EXP[i]);
            }
        }
        const msg = new Uint8Array(data.length + ecLen);
        for (let i = 0; i < data.length; i++) msg[i] = data[i];
        for (let i = 0; i < data.length; i++) {
            const coeff = msg[i];
            if (coeff !== 0) {
                for (let j = 0; j <= ecLen; j++) {
                    msg[i + j] ^= gfMul(gen[j], coeff);
                }
            }
        }
        return Array.from(msg.slice(data.length));
    }

    // QR Code tables for EC Level L
    const TOTAL_CW = [26,44,70,100,134,172,196,242,292,346,404,466,532,581,655,733,815,901,991,1085];
    const EC_CW_PB = [7,10,15,20,18,16,18,22,22,26,30,22,24,28,28,28,28,30,28,28];
    const BLOCK_INFO = [
        [1,0],[1,0],[1,0],[1,0],[2,0],[2,0],[2,0],[2,0],[2,0],[2,2],
        [4,0],[2,2],[4,0],[3,1],[4,1],[4,2],[4,2],[4,4],[3,5],[3,5]
    ]; // [numBlocksG1, numBlocksG2]
    const REMAINDER_BITS = [0,7,7,7,7,7,0,0,0,0,0,0,3,3,3,3,3,3,3,4];

    function getDataCapacity(v) {
        const bi = BLOCK_INFO[v - 1];
        const totalBlocks = bi[0] + bi[1];
        return TOTAL_CW[v - 1] - EC_CW_PB[v - 1] * totalBlocks;
    }

    function chooseVersion(byteLen) {
        for (let v = 1; v <= 20; v++) {
            const overhead = v < 10 ? 2 : 3; // mode(4bit) + count(8or16bit) = 12 or 20 bits → 2 or 3 bytes
            if (byteLen <= getDataCapacity(v) - overhead) return v;
        }
        return 0;
    }

    function getAlignmentPositions(v) {
        if (v === 1) return [];
        const count = Math.floor(v / 7) + 2;
        const first = 6, last = v * 4 + 10;
        if (count === 2) return [first, last];
        const step = Math.ceil((last - first) / (count - 1) / 2) * 2;
        const pos = [first];
        for (let p = last; pos.length < count; p -= step) pos.splice(1, 0, p);
        return pos;
    }

    function generateQR(text) {
        const utf8 = new TextEncoder().encode(text);
        const version = chooseVersion(utf8.length);
        if (!version) return null;

        const sz = version * 4 + 17;
        const matrix = Array.from({length: sz}, () => new Uint8Array(sz));
        const isReserved = Array.from({length: sz}, () => new Uint8Array(sz));

        function set(r, c, v) {
            if (r >= 0 && r < sz && c >= 0 && c < sz) { matrix[r][c] = v ? 1 : 0; isReserved[r][c] = 1; }
        }

        // Finder patterns
        function addFinder(row, col) {
            for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
                const inner = r >= 0 && r <= 6 && c >= 0 && c <= 6;
                const border = r === 0 || r === 6 || c === 0 || c === 6;
                const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                set(row + r, col + c, inner && (border || core) ? 1 : 0);
            }
        }
        addFinder(0, 0); addFinder(0, sz - 7); addFinder(sz - 7, 0);

        // Timing
        for (let i = 8; i < sz - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
        set(sz - 8, 8, 1); // dark module

        // Alignment
        const ap = getAlignmentPositions(version);
        for (const r of ap) for (const c of ap) {
            if (isReserved[r] && isReserved[r][c]) continue;
            for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
                set(r + dr, c + dc, Math.abs(dr) === 2 || Math.abs(dc) === 2 || (dr === 0 && dc === 0) ? 1 : 0);
            }
        }

        // Reserve format + version areas
        for (let i = 0; i < 9; i++) { if (i < sz) isReserved[8][i] = 1; if (i < sz) isReserved[i][8] = 1; }
        for (let i = 0; i < 8; i++) { isReserved[8][sz - 1 - i] = 1; isReserved[sz - 1 - i][8] = 1; }
        if (version >= 7) {
            for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
                isReserved[i][sz - 11 + j] = 1;
                isReserved[sz - 11 + j][i] = 1;
            }
        }

        // Build data stream
        const dataCap = getDataCapacity(version);
        const bits = [];
        function pushBits(v, n) { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); }
        pushBits(0b0100, 4); // byte mode indicator
        pushBits(utf8.length, version < 10 ? 8 : 16);
        for (const b of utf8) pushBits(b, 8);
        pushBits(0, Math.min(4, dataCap * 8 - bits.length)); // terminator
        while (bits.length % 8 !== 0) bits.push(0);
        let padToggle = 0;
        while (bits.length < dataCap * 8) { pushBits([0xEC, 0x11][padToggle % 2], 8); padToggle++; }

        const dataBytes = [];
        for (let i = 0; i < bits.length; i += 8) dataBytes.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));

        // Split into blocks
        const bi = BLOCK_INFO[version - 1];
        const ecPB = EC_CW_PB[version - 1];
        const totalBlocks = bi[0] + bi[1];
        const dcG1 = Math.floor(dataCap / totalBlocks);
        const dcG2 = bi[1] > 0 ? dcG1 + 1 : dcG1;
        const dataBlocks = [], ecBlocks = [];
        let off = 0;
        for (let g = 0; g < 2; g++) {
            const cnt = g === 0 ? bi[0] : bi[1];
            const dcPB = g === 0 ? dcG1 : dcG2;
            for (let b = 0; b < cnt; b++) {
                const block = Array.from(dataBytes.slice(off, off + dcPB));
                off += dcPB;
                dataBlocks.push(block);
                ecBlocks.push(rsEncode(block, ecPB));
            }
        }

        // Interleave
        const interleaved = [];
        const maxDC = Math.max(dcG1, dcG2);
        for (let i = 0; i < maxDC; i++) for (const b of dataBlocks) if (i < b.length) interleaved.push(b[i]);
        for (let i = 0; i < ecPB; i++) for (const b of ecBlocks) if (i < b.length) interleaved.push(b[i]);

        const allBits = [];
        for (const byte of interleaved) for (let i = 7; i >= 0; i--) allBits.push((byte >> i) & 1);
        const remBits = REMAINDER_BITS[version - 1] || 0;
        for (let i = 0; i < remBits; i++) allBits.push(0);

        // Place bits in matrix (upward zigzag)
        let bIdx = 0, upward = true;
        for (let col = sz - 1; col >= 0; col -= 2) {
            if (col === 6) col = 5;
            for (let r = 0; r < sz; r++) {
                const row = upward ? sz - 1 - r : r;
                for (const dc of [0, -1]) {
                    const c = col + dc;
                    if (c >= 0 && c < sz && !isReserved[row][c]) {
                        matrix[row][c] = bIdx < allBits.length ? allBits[bIdx++] : 0;
                    }
                }
            }
            upward = !upward;
        }

        // Apply mask 0: (row + col) % 2 === 0
        for (let r = 0; r < sz; r++) for (let c = 0; c < sz; c++) {
            if (!isReserved[r][c] && (r + c) % 2 === 0) matrix[r][c] ^= 1;
        }

        // Format info for EC Level L (01), Mask 0 (000) = 0b01000 → with BCH: 0x77C4
        const fmtBits = 0x77C4;
        for (let i = 0; i < 15; i++) {
            const bit = (fmtBits >> (14 - i)) & 1;
            if (i < 6) { set(8, i, bit); set(sz - 1 - i, 8, bit); }
            else if (i < 8) { set(8, i + 1, bit); set(sz - 1 - i, 8, bit); }
            else if (i === 8) { set(7, 8, bit); set(8, sz - 8, bit); }
            else { set(14 - i, 8, bit); set(8, sz - 15 + i, bit); }
        }

        // Version info
        if (version >= 7) {
            let vBits = version;
            for (let i = 0; i < 12; i++) vBits = (vBits << 1) ^ ((vBits >> 11) * 0x1F25);
            const vInfo = (version << 12) | (vBits & 0xFFF);
            for (let i = 0; i < 18; i++) {
                const bit = (vInfo >> i) & 1;
                matrix[Math.floor(i / 3)][sz - 11 + (i % 3)] = bit;
                matrix[sz - 11 + (i % 3)][Math.floor(i / 3)] = bit;
            }
        }

        return matrix;
    }

    /**
     * Render QR code on a canvas element — fully local, no external requests
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {string} text - Data to encode (e.g., otpauth://totp/...)
     * @param {number} [size=180] - Canvas dimension in pixels
     */
    window.generateQRLocal = function(canvas, text, size) {
        size = size || 180;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        const modules = generateQR(text);
        if (!modules) {
            ctx.fillStyle = '#f44336';
            ctx.font = '14px sans-serif';
            ctx.fillText('QR Error: data too long', 10, size / 2);
            return;
        }

        const modCount = modules.length;
        const cellSize = Math.floor(size / (modCount + 4)); // quiet zone ~2 cells each side
        const offset = Math.floor((size - cellSize * modCount) / 2);
        ctx.fillStyle = '#000000';
        for (let r = 0; r < modCount; r++) {
            for (let c = 0; c < modCount; c++) {
                if (modules[r][c]) ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
            }
        }
    };
})(window);
