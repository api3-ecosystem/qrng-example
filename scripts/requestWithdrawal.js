const hre = require('hardhat');
const airnodeAdmin = require('@api3/airnode-admin');
const { getApi } = require('../scripts/apis.js');

async function main() {
    const QrngExample = await hre.deployments.get('QrngExample');
    const qrngExample = new hre.ethers.Contract(QrngExample.address, QrngExample.abi, (await hre.ethers.getSigners())[0]);
    const apiData = getApi(hre.network);
    const airnodeAddress = apiData.airnode;
    const sponsorWalletAddress = await airnodeAdmin.deriveSponsorWalletAddress(
        apiData.xpub,
        apiData.airnode,
        qrngExample.address
      );

    // Request withdrawal...
    const receipt = await qrngExample.withdraw(airnodeAddress, sponsorWalletAddress, {gasLimit: 500000});
    console.log('Created a withdrawal transaction, waiting for it to be confirmed...');
    // wait for the transaction to be confirmed.

    const withdrawalRequestId = await receipt.wait()
    console.log(`Transaction is confirmed`);

    // Wait for the fulfillment transaction to be confirmed and read the logs
    console.log('Waiting for the fulfillment transaction...');
    const log = await new Promise((resolve) =>
    hre.ethers.provider.once(qrngExample.filters.WithdrawalRequested(airnodeAddress, sponsorWalletAddress), resolve)
    );
    console.log(`Fulfillment is confirmed, funds sent to owner`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
