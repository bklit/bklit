# GeoIP Database Setup

This directory should contain the MaxMind GeoLite2 City database for GDPR-compliant IP geolocation lookups.

## Why MaxMind GeoLite2?

Using a local GeoIP database ensures GDPR compliance by:
- ✅ **No external API calls** - IP addresses never leave your server
- ✅ **Encrypted transmission** - No HTTP requests with IPs in plain text
- ✅ **Privacy-first** - All lookups happen locally
- ✅ **Better performance** - Local lookups are faster than API calls
- ✅ **Cost-effective** - Free for GeoLite2 (vs. paid API tiers)

## Setup Instructions

### 1. Create a MaxMind Account

1. Go to https://www.maxmind.com/en/geolite2/signup
2. Create a free account (no credit card required)
3. Verify your email address

### 2. Generate a License Key

1. Log in to your MaxMind account
2. Navigate to **Account** → **Manage License Keys**
3. Click **Generate new license key**
4. Give it a name (e.g., "Bklit Development")
5. Select "No" for "Will this key be used for GeoIP Update?" (we'll download manually)
6. Copy the license key (you won't see it again!)

### 3. Download GeoLite2-City Database

#### Option A: Manual Download (Recommended for Development)

1. Go to https://www.maxmind.com/en/accounts/current/geoip/downloads
2. Find **GeoLite2 City** in the list
3. Click **Download GZIP** (GeoLite2-City.tar.gz)
4. Extract the archive
5. Copy `GeoLite2-City.mmdb` to this directory:
   ```bash
   cp ~/Downloads/GeoLite2-City_*/GeoLite2-City.mmdb /Users/matt/Bklit/bklit/apps/dashboard/data/
   ```

#### Option B: Automated Download (Production)

Use the `geoipupdate` tool to automatically download and update the database:

```bash
# Install geoipupdate (macOS)
brew install geoipupdate

# Or on Linux
# Ubuntu/Debian: sudo apt install geoipupdate
# CentOS/RHEL: sudo yum install geoipupdate

# Configure with your MaxMind credentials
cat > /usr/local/etc/GeoIP.conf <<EOF
AccountID YOUR_ACCOUNT_ID
LicenseKey YOUR_LICENSE_KEY
EditionIDs GeoLite2-City
DatabaseDirectory /Users/matt/Bklit/bklit/apps/dashboard/data
EOF

# Download the database
geoipupdate

# Optional: Set up automatic updates via cron
# Add to crontab: 0 2 * * 3 geoipupdate  # Updates every Wednesday at 2 AM
```

### 4. Verify Installation

After downloading, verify the file exists:

```bash
ls -lh /Users/matt/Bklit/bklit/apps/dashboard/data/GeoLite2-City.mmdb
```

The file should be around 60-70 MB.

### 5. Test the Integration

Start your development server and check the logs:

```bash
cd /Users/matt/Bklit/bklit
pnpm dev
```

You should see: `GeoIP2 database loaded successfully`

## Database Updates

MaxMind updates GeoLite2 databases **twice per week** (Tuesdays and Fridays).

### Manual Update
1. Download the latest database from MaxMind
2. Replace the existing `GeoLite2-City.mmdb` file
3. Restart your application

### Automatic Update (Production)
Set up a cron job with `geoipupdate`:

```bash
# Edit crontab
crontab -e

# Add this line to update every Wednesday at 2 AM
0 2 * * 3 geoipupdate
```

## Fallback Behavior

If the GeoLite2 database is not found, the application will automatically fall back to:

1. **Cloudflare headers** (if request comes through Cloudflare proxy)
2. **ip-api.com** (over HTTPS) as a last resort

However, for best GDPR compliance, we recommend keeping the local database up-to-date.

## Privacy & GDPR Compliance

### What Data is Stored?

The MaxMind GeoLite2-City database contains:
- Country, region, and city names
- Latitude and longitude (approximate)
- Time zone information
- Postal codes

It does **NOT** contain:
- Personal information
- Exact addresses
- ISP information (available in GeoIP2-ISP, separate database)

### How This Ensures GDPR Compliance

1. **No third-party data sharing** - IP addresses never leave your server
2. **Data minimization** - Only geolocation data is extracted, IP is not stored
3. **Local processing** - All lookups happen on your infrastructure
4. **Encryption** - No unencrypted HTTP requests with IP addresses

### Important Notes

- IP addresses are still considered personal data under GDPR
- Ensure you have a lawful basis for processing geolocation (e.g., legitimate interest)
- Document this in your privacy policy
- Don't store full IP addresses unless necessary and justified
- Consider anonymizing IPs after geolocation lookup (e.g., zeroing out last octet)

## License

GeoLite2 is provided under the [Creative Commons Attribution-ShareAlike 4.0 International License](https://creativecommons.org/licenses/by-sa/4.0/).

You must include the following attribution in your application:

> This product includes GeoLite2 data created by MaxMind, available from https://www.maxmind.com

## Troubleshooting

### "GeoIP2 database not found"

- Verify the file exists: `ls apps/dashboard/data/GeoLite2-City.mmdb`
- Check file permissions: `chmod 644 apps/dashboard/data/GeoLite2-City.mmdb`
- Ensure the path matches the one in `ip-geolocation.ts`

### "AddressNotFoundError"

- The IP address is not in the database (e.g., private IP like 192.168.x.x)
- This is normal for localhost/private IPs - the code handles this gracefully

### Database is outdated

- Download a fresh copy from MaxMind (databases expire after ~2-3 months)
- Set up automated updates with `geoipupdate`

## Production Deployment

For production environments (e.g., Vercel):

1. **Upload database to persistent storage** - Vercel ephemeral filesystem won't persist the file
   - Use Vercel Blob Storage: https://vercel.com/docs/storage/vercel-blob
   - Or store on S3/R2 and download on cold start

2. **Environment variable for database path**:
   ```env
   GEOIP_DB_PATH=/path/to/GeoLite2-City.mmdb
   ```

3. **Update `ip-geolocation.ts`** to use environment variable:
   ```typescript
   const dbPath = process.env.GEOIP_DB_PATH || path.join(process.cwd(), "data", "GeoLite2-City.mmdb");
   ```

4. **Set up automated updates** via CI/CD or scheduled function

## Resources

- [MaxMind GeoLite2 Free Geolocation Data](https://dev.maxmind.com/geoip/geolite2-free-geolocation-data)
- [MaxMind GeoIP2 Node.js API](https://github.com/maxmind/GeoIP2-node)
- [GDPR and IP Addresses](https://gdpr.eu/eu-gdpr-personal-data/)
- [GeoIP Update Tool](https://github.com/maxmind/geoipupdate)

