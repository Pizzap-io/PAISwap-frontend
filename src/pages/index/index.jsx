import React, { useState, useEffect } from 'react'
import './index.scss'
import Button from '@/components/Button'
import Footer from '@/components/app-footer'
import Web3 from 'web3'
import { ABI, PNFT_CONTRACT_ADDRESS, PISTAKING_CONTRACT_ADDRESS, gas, gasPrice } from '@/util/abi'
import { message } from 'antd'

import banner from '@/assets/images/banner.png'

let web3
if (typeof window.web3 !== 'undefined') {
  web3 = new Web3(window.web3.currentProvider)
}

const Index = () => {
  const [address, setAddress] = useState('')
  const [activeTab, setActiveTab] = useState('deposit')
  const [showModal, setShowModal] = React.useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalSupply, setTotalSupply] = useState(0)
  const [userBalance, setUserBalance] = useState(0) // 挖矿赚取PNFT
  const [stakingAmount, setStakingAmount] = useState(0)
  const [pendingReward, setPendingReward] = useState(0) // 挖矿赚取
  const [balance, setBalance] = useState(0) // 钱包余额
  const [extractAmount, setExtractAmount] = useState(0) // 提取

  // 质押
  const deposit = () => {
    if (+depositAmount > +balance) {
      message.error('超过余额')
      return
    }

    let MyContract = new web3.eth.Contract(ABI, PISTAKING_CONTRACT_ADDRESS)

    const balance_ = depositAmount.toString()

    console.log(balance_, web3.utils.toWei(balance_, 'ether'))

    MyContract.methods
      .deposit()
      .send({
        from: address,
        gas: gas,
        gasPrice: gasPrice,
        value: web3.utils.toWei(balance_, 'ether')
      })
      .on('transactionHash', function (hash) {
        message.info(hash, 'Waiting for tx confirmation:')
      })
      .on('receipt', function (receipt) {
        message.success('Swaped successfully, please check your balance!')
      })
      .on('error', function (error, receipt) {
        if (!error.message) {
          message.error('Swap failure', error.toString())
        } else {
          message.error(error.message)
        }
      })
  }

  // 质押Pi
  const getStaking = () => {
    let MyContract = new web3.eth.Contract(ABI, PISTAKING_CONTRACT_ADDRESS)
    MyContract.methods
      .getStaking(address)
      .call()
      .then(function (result) {
        setStakingAmount(web3.utils.fromWei(result))
      })
      .catch(err => message.error(err.message))
  }

  const getPendingReward = () => {
    let MyContract = new web3.eth.Contract(ABI, PISTAKING_CONTRACT_ADDRESS)
    MyContract.methods
      .pendingReward(address)
      .call()
      .then(function (result) {
        setPendingReward(web3.utils.fromWei(result))
      })
      .catch(err => message.error(err.message))
  }

  const withdraw = () => {
    let MyContract = new web3.eth.Contract(ABI, PISTAKING_CONTRACT_ADDRESS)

    const balance = extractAmount.toString()

    console.log(balance, web3.utils.toWei(balance, 'ether'))

    MyContract.methods
      .withdraw(web3.utils.toWei(balance, 'ether'))
      .send({
        from: address,
        gas: gas,
        gasPrice: gasPrice
      })
      .on('transactionHash', function (hash) {
        message.info(hash, 'Waiting for tx confirmation:')
      })
      .on('receipt', function (receipt) {
        message.success('Swaped successfully, please check your balance!')
      })
      .on('error', function (error, receipt) {
        if (!error.message) {
          message.error('Swap failure', error.toString())
        } else {
          message.error(error.message)
        }
      })
  }

  // 质押总量
  const getTotalSupply = () => {
    let MyContract = new web3.eth.Contract(ABI, PISTAKING_CONTRACT_ADDRESS)
    MyContract.methods
      .getTotalSupply()
      .call()
      .then(function (result) {
        console.log(web3.utils.fromWei(result))
        setTotalSupply(web3.utils.fromWei(result))
      })
      .catch(err => message.error(err.message))
  }

  // 挖矿赚取PNFT
  const getUserBalance = () => {
    let MyContract = new web3.eth.Contract(ABI, PNFT_CONTRACT_ADDRESS)
    MyContract.methods
      .balanceOf(address)
      .call()
      .then(function (result) {
        console.log(web3.utils.fromWei(result))
        setUserBalance(web3.utils.fromWei(result))
      })
      .catch(err => message.error(err.message))
  }

  // 待挖取
  const getTotalBalance = () => {
    let MyContract = new web3.eth.Contract(ABI, PNFT_CONTRACT_ADDRESS)
    MyContract.methods
      .balanceOf('0xbBeAB8d29458ac35Ac455669949A8907A2307787')
      .call()
      .then(result => {
        setTotalBalance(web3.utils.fromWei(result))
      })
      .catch(err => message.error(err.message))
  }

  // 钱包余额
  const getBalance = async () => {
    try {
      const { ethereum } = window
      const bal = await ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      })
      setBalance(web3.utils.fromWei(bal.toString(), 'ether'))
    } catch (error) {
      setBalance(0)
      message.error(error.message.toString())
    }
  }

  const checkAddress = () => {
    console.log(address)
    return Boolean(address)
  }

  const depositClick = tab => {
    if (!checkAddress()) {
      message.error('please connect wallet')
      return
    }
    setShowModal(true)
    setActiveTab(tab)
    getPendingReward()
    getBalance()
  }

  const isMetaMaskInstalled = () => {
    //Have to check the ethereum binding on the window object to see if it's installed
    const { ethereum } = window
    return Boolean(ethereum && ethereum.isMetaMask)
  }

  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      message.error('需要安装metamask')
      return
    }
    setAddress(window.sessionStorage.getItem('address'))
    getTotalBalance()
    address && getUserBalance()
    getTotalSupply()
    address && getStaking()
  }, [])

  const modal = (
    <div className="modal">
      <div className="modal-close" onClick={() => setShowModal(false)}>
        &times;
      </div>
      <div className="tab">
        <div
          className={`tab-item ${activeTab === 'deposit' ? 'active' : ''}`}
          onClick={() => setActiveTab('deposit')}>
          质押
        </div>
        <div
          className={`tab-item ${activeTab === 'extract' ? 'active' : ''}`}
          onClick={() => setActiveTab('extract')}>
          提取
        </div>
      </div>
      {activeTab === 'deposit' ? (
        <>
          <div className="modal-cell">
            <div className="modal-title">质押数量</div>
          </div>
          <div className="modal-input">
            <div className="modal-input-max" onClick={() => setDepositAmount(balance.toString())}>
              MAX
            </div>
            <input
              type="number"
              onChange={e => setDepositAmount(e.target.value)}
              value={depositAmount}
            />
            <div>Pi</div>
          </div>
          <div className="modal-cell">
            <div className="modal-title">钱包余额</div>
            <div className="modal-amount">{balance} PI</div>
          </div>
          <Button className="submit" onClick={deposit}>
            质押
          </Button>
        </>
      ) : null}

      {activeTab === 'extract' ? (
        <>
          <div className="modal-cell">
            <div className="modal-title">已质押</div>
          </div>
          <div className="modal-input">
            <input
              type="number"
              value={extractAmount}
              onChange={e => setExtractAmount(e.target.value)}
            />
            <div>Pi</div>
          </div>
          <div className="modal-cell">
            <div className="modal-title">挖矿赚取</div>
          </div>
          <div className="modal-input">
            <input value={pendingReward} readOnly />
            <div>PNFT</div>
          </div>
          <Button className="submit" onClick={withdraw}>
            提取
          </Button>
        </>
      ) : null}
    </div>
  )

  return (
    <>
      <div className="banner">
        <img src={banner} alt="" />
      </div>
      <div className="content flex flex-wrap sm:flex-nowrap">
        <div className="box mr-0 sm:mr-14">
          <div className="box-title">当前全网质押总量为</div>
          <div className="box-amount">{totalSupply} PI</div>
          <div className="box-highlight">待挖取PNFT数量</div>
          <div className="box-amount">{totalBalance}</div>
        </div>
        <div className="box">
          <div className="box-title">质押Pi</div>
          <div className="box-amount">
            <div>{stakingAmount}</div>
            <Button onClick={() => depositClick('deposit')}>质押</Button>
          </div>
          <div className="box-title">挖矿赚取PNFT</div>
          <div className="box-amount">
            <div>{userBalance}</div>
            <Button onClick={() => depositClick('extract')}>提取</Button>
          </div>
        </div>
      </div>
      {showModal ? modal : null}
      <Footer />
    </>
  )
}

export default Index
