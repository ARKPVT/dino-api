const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const config = {
    user: 'ARKDS',
    password: 'Mk123456',
    server: 'mssql-200394-0.cloudclusters.net',
    port: 19623,
    database: 'DinoBook',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Tạo pool kết nối dùng lại, tránh connect lại nhiều lần
let pool;
async function getPool() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

// Đăng nhập
app.post('/api/login', async (req, res) => {
    const { loginEmail, loginPassword } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('loginEmail', sql.NVarChar, loginEmail)
            .input('loginPassword', sql.NVarChar, loginPassword)
            .query(`
                SELECT TOP (1) [TenNguoiDung], [TenDangNhap], [MatKhau]
                FROM [DinoBook].[dbo].[TaiKhoan]
                WHERE TenDangNhap = @loginEmail
                AND MatKhau = @loginPassword
            `);
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({ 
                success: true, 
                tenNguoiDung: user.TenNguoiDung,
                tenDangNhap: user.TenDangNhap
            });
        } else {
            res.json({ success: false, message: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        }
    } catch (err) {
        console.error('Lỗi server:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
});

// Đăng ký
app.post('/api/register', async (req, res) => {
    const { username, password, tenNguoiDung } = req.body;
    if (!username || !password || !tenNguoiDung) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ tên đăng nhập, mật khẩu và tên người dùng.' });
    }
    try {
        const pool = await getPool();

        // Kiểm tra tài khoản đã tồn tại chưa
        const checkResult = await pool.request()
            .input('username', sql.NVarChar, username)
            .query(`
                SELECT * FROM [DinoBook].[dbo].[TaiKhoan]
                WHERE TenDangNhap = @username
            `);

        if (checkResult.recordset.length > 0) {
            return res.json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
        }

        // Thêm tài khoản mới
        await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .input('tenNguoiDung', sql.NVarChar, tenNguoiDung)
            .query(`
                INSERT INTO [DinoBook].[dbo].[TaiKhoan] (TenDangNhap, MatKhau, TenNguoiDung)
                VALUES (@username, @password, @tenNguoiDung)
            `);

        res.json({ success: true, message: 'Đăng ký thành công.' });
    } catch (err) {
        console.error('Lỗi server:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send('API đang chạy!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('API server running on port ' + port);
});